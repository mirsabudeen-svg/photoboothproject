package com.futad.photobooth.feature.admin

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.futad.photobooth.core.designsystem.components.BigButton

@Composable
fun SetPinScreen(
    onPinSet: () -> Unit,
    onSetPin: (String) -> Boolean,
    modifier: Modifier = Modifier,
) {
    var pin by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Set Operator PIN", fontSize = 28.sp, color = MaterialTheme.colorScheme.primary)
        Text("Choose a 4-8 digit PIN for admin access.", fontSize = 16.sp)
        OutlinedTextField(value = pin, onValueChange = { pin = it.filter(Char::isDigit).take(8) }, label = { Text("PIN") })
        OutlinedTextField(value = confirm, onValueChange = { confirm = it.filter(Char::isDigit).take(8) }, label = { Text("Confirm PIN") })
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        BigButton(
            text = "Save PIN",
            enabled = pin.length >= 4 && pin == confirm,
            onClick = {
                error = null
                if (onSetPin(pin)) onPinSet() else error = "Could not save PIN"
            },
        )
    }
}
