package com.futad.photobooth.feature.sharing

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.futad.photobooth.core.designsystem.components.BigButton

private val E164_REGEX = Regex("""^\+[1-9]\d{7,14}$""")

@Composable
fun ShareScreen(
    qrContent: String,
    smsPhone: String,
    onSmsPhoneChange: (String) -> Unit,
    onSmsShare: () -> Unit,
    onWhatsAppShare: () -> Unit,
    onEmailShare: () -> Unit,
    onDone: () -> Unit,
    qrGenerator: QRCodeGenerator,
    modifier: Modifier = Modifier,
) {
    val qrBitmap = remember(qrContent) { qrGenerator.generate(qrContent) }
    val isValidPhone = remember(smsPhone) { smsPhone.isBlank() || E164_REGEX.matches(smsPhone.trim()) }
    Column(
        modifier = modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Scan to download", fontSize = 28.sp, color = MaterialTheme.colorScheme.primary)
        Image(bitmap = qrBitmap.asImageBitmap(), contentDescription = "QR code")
        OutlinedTextField(
            value = smsPhone,
            onValueChange = onSmsPhoneChange,
            label = { Text("Phone for SMS (E.164)") },
            supportingText = {
                if (!isValidPhone) Text("Use format +15551234567")
            },
            isError = !isValidPhone,
            modifier = Modifier.padding(vertical = 8.dp),
            singleLine = true,
        )
        BigButton(
            text = "Send SMS",
            onClick = onSmsShare,
            enabled = smsPhone.isNotBlank() && isValidPhone,
        )
        BigButton(text = "WhatsApp", onClick = onWhatsAppShare)
        BigButton(text = "Email", onClick = onEmailShare)
        BigButton(text = "Done", onClick = onDone)
    }
}
