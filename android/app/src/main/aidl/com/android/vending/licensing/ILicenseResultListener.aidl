// Android Play Licensing binder contract. Copyright (C) 2010 The Android Open Source Project.
// SPDX-License-Identifier: Apache-2.0
package com.android.vending.licensing;

oneway interface ILicenseResultListener {
    void verifyLicense(int responseCode, String signedData, String signature);
}
