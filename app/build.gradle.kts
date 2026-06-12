/** Ensures BuildConfig API URL ends with a single trailing slash inside the quoted string. */
fun quotedApiBaseUrl(propertyName: String, fallback: String): String {
    val raw = (project.findProperty(propertyName) as String?)?.trim().orEmpty()
    val base = (if (raw.isEmpty()) fallback else raw).removeSuffix("/")
    return "\"$base/\""
}

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.futad.photobooth"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.futad.photobooth"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        manifestPlaceholders["SENTRY_DSN"] = ""
    }

    flavorDimensions += "env"
    productFlavors {
        create("dev") {
            dimension = "env"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1/\"")
        }
        create("staging") {
            dimension = "env"
            buildConfigField(
                "String",
                "API_BASE_URL",
                quotedApiBaseUrl(
                    "photobooth.stagingApiBaseUrl",
                    "https://staging-api.yourdomain.com/api/v1",
                ),
            )
        }
        create("prod") {
            dimension = "env"
            buildConfigField(
                "String",
                "API_BASE_URL",
                quotedApiBaseUrl("photobooth.apiBaseUrl", "https://api.yourdomain.com/api/v1"),
            )
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(project(":kiosk"))
    implementation(project(":core:domain"))
    implementation(project(":core:data"))
    implementation(project(":core:database"))
    implementation(project(":core:network"))
    implementation(project(":core:designsystem"))
    implementation(project(":feature:attract"))
    implementation(project(":feature:consent"))
    implementation(project(":feature:capture"))
    implementation(project(":feature:overlay"))
    implementation(project(":feature:ai"))
    implementation(project(":feature:printing"))
    implementation(project(":feature:sharing"))
    implementation(project(":feature:sync"))
    implementation(project(":feature:admin"))
    implementation(project(":hardware:camera"))
    implementation(project(":hardware:printer"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
    implementation(libs.hilt.android)
    implementation(libs.hilt.navigation.compose)
    implementation(libs.hilt.work)
    implementation(libs.timber)
    implementation("io.sentry:sentry-android:7.14.0")
    ksp(libs.hilt.compiler)
    ksp(libs.androidx.hilt.compiler)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    implementation(libs.sqlcipher)
    implementation(libs.nanohttpd)
}
