import { createHash, createPublicKey, verify } from "node:crypto";
import { Environment, SignedDataVerifier } from "@apple/app-store-server-library";
import { verifyAssertion, verifyAttestation } from "node-app-attest";

const bundleIdentifier = "com.eidomancer.app";

export function playVerifier(publicKey, versions) {
  const key = createPublicKey({ key: Buffer.from(publicKey, "base64"), format: "der", type: "spki" });
  if (key.asymmetricKeyType !== "rsa" || key.asymmetricKeyDetails.modulusLength < 2048) {
    throw new Error("Invalid Google Play license public key.");
  }
  return ({ signedData, signature }, challenge, now) => {
    if (typeof signedData !== "string" || signedData.length > 4096 ||
        typeof signature !== "string" || signature.length > 1024 ||
        !verify("RSA-SHA1", Buffer.from(signedData), key, Buffer.from(signature, "base64"))) return null;
    const [data, extras] = signedData.split(":", 2);
    const [code, nonce, bundle, version, owner, timestamp, ...rest] = data.split("|");
    const issued = Number(timestamp);
    const validThrough = Number(new URLSearchParams(extras).get("VT"));
    if (rest.length || code !== "0" || nonce !== String(challenge.nonce) ||
        bundle !== bundleIdentifier || !versions.includes(version) ||
        !/^[A-Za-z0-9_+=/-]{1,128}$/.test(owner || "") ||
        !Number.isSafeInteger(issued) || issued < challenge.created - 30000 || issued > now + 30000 ||
        !Number.isSafeInteger(validThrough) || validThrough <= now) return null;
    return { owner, expires: validThrough };
  };
}

export function appleVerifier({ roots, appId, teamIdentifier, sandbox }) {
  const environment = sandbox ? Environment.SANDBOX : Environment.PRODUCTION;
  const verifier = new SignedDataVerifier(roots, true, environment, bundleIdentifier, appId);
  return async ({ transaction, keyId, attestation, assertion }, challenge, previous) => {
    if (typeof transaction !== "string" || transaction.length > 14000 ||
        typeof keyId !== "string" || keyId.length > 80 ||
        typeof (previous ? assertion : attestation) !== "string") return null;
    if (previous && previous.keyId !== keyId) return null;
    const payload = `${challenge.id}.${challenge.install}.${createHash("sha256").update(transaction).digest("hex")}`;
    const context = { bundleIdentifier, teamIdentifier };
    const proof = previous
      ? { keyId, publicKey: previous.publicKey, ...verifyAssertion({
        ...context, assertion: Buffer.from(assertion, "base64"), payload,
        publicKey: previous.publicKey, signCount: previous.signCount,
      }) }
      : { ...verifyAttestation({
        ...context, attestation: Buffer.from(attestation, "base64"), challenge: payload,
        keyId, allowDevelopmentEnvironment: sandbox,
      }), signCount: 0 };

    const decoded = await verifier.verifyAndDecodeAppTransaction(transaction);
    if (!decoded.appTransactionId) return null;
    return { owner: decoded.appTransactionId, keyId, publicKey: proof.publicKey, signCount: proof.signCount };
  };
}
