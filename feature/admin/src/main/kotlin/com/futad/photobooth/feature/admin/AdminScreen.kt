package com.futad.photobooth.feature.admin

import android.app.ActivityManager
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.StatFs
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.futad.photobooth.core.designsystem.components.BigButton
import com.futad.photobooth.core.domain.model.Event
import com.futad.photobooth.core.domain.model.WeddingEventConfig

@Composable
fun AdminScreen(
    deviceStatus: DeviceStatus,
    activeEvent: Event?,
    companionHostIp: String,
    onCompanionHostIpChange: (String) -> Unit,
    onSaveCompanionHostIp: () -> Unit,
    onUnlock: (String) -> Boolean,
    onCreateDemoEvent: () -> Unit,
    onUnpair: () -> Unit,
    onExitAdmin: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var pin by remember { mutableStateOf("") }
    var unlocked by remember { mutableStateOf(false) }

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Operator Admin", fontSize = 32.sp, color = MaterialTheme.colorScheme.primary)
        if (!unlocked) {
            OutlinedTextField(value = pin, onValueChange = { pin = it }, label = { Text("PIN") })
            BigButton(text = "Unlock", onClick = {
                unlocked = onUnlock(pin)
            })
        } else {
            Text("Network: ${if (deviceStatus.online) "Online" else "Offline"}")
            Text("Storage free: ${deviceStatus.freeStorageMb} MB")
            Text("Camera: ${deviceStatus.cameraOk}")
            Text("Upload queue: ${deviceStatus.uploadQueueCount}")
            Text("Print queue: ${deviceStatus.printQueueCount}")
            Text("Printer: ${deviceStatus.printerStatus}")
            OutlinedTextField(
                value = companionHostIp,
                onValueChange = onCompanionHostIpChange,
                label = { Text("Companion Host IP") },
                placeholder = { Text("192.168.1.50") },
                singleLine = true,
            )
            BigButton(text = "Save Printer Host", onClick = onSaveCompanionHostIp)
            activeEvent?.let {
                Text("Event: ${it.eventName}")
                Text("Theme: ${it.config.themeId}")
            } ?: BigButton(text = "Create Demo Wedding Event", onClick = onCreateDemoEvent)
            BigButton(text = "Unpair Device", onClick = onUnpair)
            BigButton(text = "Exit Admin", onClick = onExitAdmin)
        }
    }
}

data class DeviceStatus(
    val online: Boolean,
    val freeStorageMb: Long,
    val cameraOk: Boolean,
    val uploadQueueCount: Int,
    val printQueueCount: Int,
    val printerStatus: String = "Not configured",
)

object DeviceStatusProvider {
    fun from(context: Context, uploadQueue: Int, printQueue: Int): DeviceStatus {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork
        val caps = cm.getNetworkCapabilities(network)
        val online = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
        val stat = StatFs(context.filesDir.absolutePath)
        val freeMb = stat.availableBytes / (1024 * 1024)
        return DeviceStatus(
            online = online,
            freeStorageMb = freeMb,
            cameraOk = true,
            uploadQueueCount = uploadQueue,
            printQueueCount = printQueue,
        )
    }
}

fun demoWeddingEvent(): Event {
    val config = WeddingEventConfig(
        brideName = "Aisha",
        groomName = "Omar",
        themeId = "luxury_gold",
        hashtag = "#AishaAndOmar",
        templateId = "4x6_postcard",
        consentText = "I consent to having my photo taken at this event and understand images may be shared with other guests.",
    )
    return Event(
        eventId = "demo-wedding-1",
        eventName = "Aisha & Omar Wedding",
        config = config,
        updatedAt = System.currentTimeMillis(),
        isActive = true,
    )
}
