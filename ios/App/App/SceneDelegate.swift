import UIKit
import Capacitor
import CryptoKit
import DeviceCheck
import StoreKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = EidomancerViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}


final class EidomancerViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StoreProofPlugin())
    }
}

@objc(StoreProofPlugin)
final class StoreProofPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "StoreProofPlugin"
    let jsName = "StoreProof"
    let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "prove", returnType: CAPPluginReturnPromise)!]

    @objc func prove(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let install = call.getString("install"),
              let registered = call.getBool("registered") else {
            call.reject("Invalid App Store verification challenge.")
            return
        }
        Task { @MainActor in
            let service = DCAppAttestService.shared
            guard service.isSupported else {
                call.reject("Store access verification requires a supported iPhone.")
                return
            }
            do {
                let result = try await AppTransaction.shared
                guard case .verified = result else {
                    call.reject("The App Store couldn’t verify access.")
                    return
                }
                let transaction = result.jwsRepresentation
                let digest = SHA256.hash(data: Data(transaction.utf8)).map { String(format: "%02x", $0) }.joined()
                let payload = "\(id).\(install).\(digest)"
                let hash = Data(SHA256.hash(data: Data(payload.utf8)))
                let storageKey = "eidomancer.attest." + install

                if registered {
                    guard let keyId = UserDefaults.standard.string(forKey: storageKey) else {
                        call.reject("Restore store access to register this iPhone again.", "RESTORE_REQUIRED")
                        return
                    }
                    do {
                        let assertion = try await service.generateAssertion(keyId, clientDataHash: hash)
                        call.resolve(["transaction": transaction, "keyId": keyId, "assertion": assertion.base64EncodedString()])
                    } catch {
                        let failure = error as NSError
                        if failure.domain == DCError.errorDomain && failure.code == DCError.invalidKey.rawValue {
                            call.reject("Restore store access to register this iPhone again.", "RESTORE_REQUIRED")
                        } else {
                            throw error
                        }
                    }
                } else {
                    let keyId = try await service.generateKey()
                    let attestation = try await service.attestKey(keyId, clientDataHash: hash)
                    UserDefaults.standard.set(keyId, forKey: storageKey)
                    call.resolve(["transaction": transaction, "keyId": keyId, "attestation": attestation.base64EncodedString()])
                }
            } catch {
                call.reject("The App Store couldn’t verify access. Check your connection and App Store account.")
            }
        }
    }
}
