// Android Play Licensing binder contract. Copyright (C) 2010 The Android Open Source Project.
// SPDX-License-Identifier: Apache-2.0
package com.android.vending.licensing;

import com.android.vending.licensing.ILicenseResultListener;

oneway interface ILicensingService {
    void checkLicense(long nonce, String packageName, in ILicenseResultListener listener);
}
