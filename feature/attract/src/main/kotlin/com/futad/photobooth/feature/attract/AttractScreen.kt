package com.futad.photobooth.feature.attract

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.futad.photobooth.core.domain.model.WeddingEventConfig
import kotlinx.coroutines.delay

@Composable
fun AttractScreen(
    config: WeddingEventConfig?,
    eventName: String? = null,
    onStart: () -> Unit,
    onAdminAccess: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var visible by remember { mutableStateOf(false) }
    var adminTapCount by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        delay(100)
        visible = true
    }

    val infiniteTransition = rememberInfiniteTransition(label = "attract")
    val shimmerOffset by infiniteTransition.animateFloat(
        initialValue = -300f,
        targetValue = 300f,
        animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing), RepeatMode.Restart),
        label = "shimmer",
    )
    val tapAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "tap-pulse",
    )
    val dividerWidthFloat by infiniteTransition.animateFloat(
        initialValue = 60f,
        targetValue = 160f,
        animationSpec = infiniteRepeatable(tween(2000, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "divider",
    )

    val displayName = eventName?.takeIf { it.isNotBlank() }
        ?: listOfNotNull(
            config?.brideName?.takeIf { it.isNotBlank() },
            config?.groomName?.takeIf { it.isNotBlank() },
        ).joinToString(" & ").ifBlank { "Welcome" }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(800)) + slideInVertically(tween(800)) { it / 4 },
    ) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .pointerInput(Unit) {
                    detectTapGestures { onStart() }
                },
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(32.dp),
                modifier = Modifier.padding(32.dp),
            ) {
                Box {
                    Text(
                        text = displayName,
                        style = MaterialTheme.typography.displayLarge.copy(
                            fontSize = 48.sp,
                            fontWeight = FontWeight.Light,
                        ),
                        color = MaterialTheme.colorScheme.primary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .pointerInput(Unit) {
                                detectTapGestures {
                                    adminTapCount++
                                    if (adminTapCount >= 5) {
                                        adminTapCount = 0
                                        onAdminAccess()
                                    }
                                }
                            },
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .graphicsLayer { alpha = 0.35f }
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        Color.Transparent,
                                        Color.White.copy(alpha = 0.5f),
                                        Color.Transparent,
                                    ),
                                    startX = shimmerOffset,
                                    endX = shimmerOffset + 200f,
                                ),
                            ),
                    )
                }

                Box(
                    modifier = Modifier
                        .width(dividerWidthFloat.dp)
                        .height(1.dp)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)),
                )

                Text(
                    text = "TAP TO BEGIN",
                    style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 4.sp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = tapAlpha),
                    modifier = Modifier.graphicsLayer { alpha = tapAlpha },
                )
            }

            AttractCornerDecorations(
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                modifier = Modifier.fillMaxSize(),
            )
        }
    }
}

@Composable
private fun AttractCornerDecorations(color: Color, modifier: Modifier = Modifier) {
    Box(modifier = modifier) {
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(24.dp)
                .width(48.dp)
                .height(48.dp)
                .background(color.copy(alpha = 0.15f)),
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp)
                .width(48.dp)
                .height(48.dp)
                .background(color.copy(alpha = 0.15f)),
        )
    }
}
