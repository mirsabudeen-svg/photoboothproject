package com.futad.photobooth.core.designsystem.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun BigButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = Color(0xFFFFD700),
    contentColor: Color = Color(0xFF212121),
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(72.dp),
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = contentColor,
        ),
    ) {
        Text(text = text, fontSize = 22.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun CountdownOverlay(count: Int, modifier: Modifier = Modifier) {
    AnimatedContent(
        targetState = if (count > 0) count else 0,
        transitionSpec = {
            (scaleIn(tween(200)) + fadeIn(tween(200))).togetherWith(
                scaleOut(tween(150, easing = FastOutLinearInEasing)) + fadeOut(tween(150)),
            )
        },
        label = "countdown",
        modifier = modifier,
    ) { value ->
        Text(
            text = if (value > 0) value.toString() else "Smile!",
            fontSize = 120.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
        )
    }
}
