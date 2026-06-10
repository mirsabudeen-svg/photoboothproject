package com.futad.photobooth.kiosk

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.view.WindowManager
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class KioskModeManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val dpm: DevicePolicyManager? =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager

    fun isDeviceOwner(): Boolean {
        val admin = adminComponent()
        return dpm?.isDeviceOwnerApp(context.packageName) == true &&
            dpm.isAdminActive(admin)
    }

    fun enterLockTask(activity: Activity) {
        activity.window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            activity.window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        if (isDeviceOwner()) {
            dpm?.setLockTaskPackages(adminComponent(), arrayOf(context.packageName))
            activity.startLockTask()
        } else {
            // Fallback: immersive sticky when not provisioned as device owner
            @Suppress("DEPRECATION")
            activity.window.decorView.systemUiVisibility = (
                android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                    android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                )
        }
    }

    fun exitLockTask(activity: Activity) {
        val am = activity.getSystemService(android.app.ActivityManager::class.java)
        if (am?.isInLockTaskMode == true) {
            activity.stopLockTask()
        }
    }

    fun adminComponent(): ComponentName =
        ComponentName(context, KioskDeviceAdminReceiver::class.java)
}

