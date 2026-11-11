package com.eidomancer.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.RemoteException;
import com.android.vending.licensing.ILicenseResultListener;
import com.android.vending.licensing.ILicensingService;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StoreProof")
public class StoreProofPlugin extends Plugin {
    @PluginMethod
    public void prove(PluginCall call) {
        Integer nonce = call.getInt("nonce");
        if (nonce == null || nonce <= 0) {
            call.reject("Invalid Play license challenge.");
            return;
        }
        new Handler(Looper.getMainLooper()).post(() -> new LicenseRequest(call, nonce).start());
    }

    private final class LicenseRequest implements ServiceConnection {
        private final PluginCall call;
        private final long nonce;
        private final Handler handler = new Handler(Looper.getMainLooper());
        private final Runnable timeout = () -> finish(null);
        private boolean bound;
        private boolean completed;

        LicenseRequest(PluginCall call, long nonce) {
            this.call = call;
            this.nonce = nonce;
        }

        void start() {
            Intent intent = new Intent("com.android.vending.licensing.ILicensingService")
                .setPackage("com.android.vending");
            try {
                bound = getContext().bindService(intent, this, Context.BIND_AUTO_CREATE);
            } catch (SecurityException ignored) {
                finish(null);
                return;
            }
            if (bound) handler.postDelayed(timeout, 12000);
            else finish(null);
        }

        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            if (completed) return;
            try {
                ILicensingService.Stub.asInterface(service).checkLicense(nonce, getContext().getPackageName(),
                    new ILicenseResultListener.Stub() {
                        @Override
                        public void verifyLicense(int code, String signedData, String signature) {
                            handler.post(() -> {
                                if (code != 0 || signedData == null || signature == null) {
                                    finish(null);
                                    return;
                                }
                                JSObject proof = new JSObject();
                                proof.put("signedData", signedData);
                                proof.put("signature", signature);
                                finish(proof);
                            });
                        }
                    });
            } catch (RemoteException ignored) {
                finish(null);
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            finish(null);
        }

        private void finish(JSObject proof) {
            if (completed) return;
            completed = true;
            handler.removeCallbacks(timeout);
            if (bound) getContext().unbindService(this);
            if (proof == null) call.reject("Google Play couldn’t verify access. Check your Play account and connection.");
            else call.resolve(proof);
        }
    }
}
