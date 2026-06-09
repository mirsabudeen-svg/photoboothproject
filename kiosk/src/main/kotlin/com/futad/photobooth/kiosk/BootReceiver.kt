package com.futad.photobooth.kiosk

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.futad.photobooth.kiosk.BootReceiver.Companion.BOOT_ACTION

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED || intent?.action == BOOT_ACTION) {
            val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launch)
        }
    }

    companion object {
        const val BOOT_ACTION = Intent.ACTION_BOOT_COMPLETED
    }
}
