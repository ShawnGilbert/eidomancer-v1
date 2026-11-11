import { Capacitor, registerPlugin } from "@capacitor/core";

const StoreProof = registerPlugin("StoreProof");
const installationKey = "eidomancer.installation";
let session;
let registering;

function installation(reset = false) {
  let id = reset ? null : localStorage.getItem(installationKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(installationKey, id);
  }
  return id;
}

async function register(post, reset) {
  const install = installation(reset);
  const platform = Capacitor.getPlatform();
  const challenge = await post("entitlements/challenge", { platform, install });
  try {
    const proof = await StoreProof.prove({ ...challenge, install });
    return await post("entitlements/verify", { id: challenge.id, proof });
  } catch (error) {
    if (error.code === "RESTORE_REQUIRED" && !reset) return register(post, true);
    throw error;
  }
}

export async function storeToken(post) {
  if (!Capacitor.isNativePlatform()) return undefined;
  if (session?.expires > Date.now() + 5000) return session.token;
  registering ??= register(post, false).finally(() => { registering = undefined; });
  session = await registering;
  return session.token;
}

export function clearStoreToken() {
  session = undefined;
}
