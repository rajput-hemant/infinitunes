import { withProjectBuildGradle, type ConfigPlugin } from "expo/config-plugins";

const MARKER = "plugins/android-kotlin-target";

// Libraries that set neither Java nor Kotlin compatibility (react-native-image-colors)
// get Java 17 from AGP but Kotlin's jvmTarget from the JDK running Gradle (21).
// Gradle then fails with "Inconsistent JVM-target compatibility".
const BLOCK = `
// Added by ${MARKER}: keep Kotlin on the same JVM target as Java.
subprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinJvmCompile).configureEach {
    compilerOptions.jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
  }
}
`;

const withKotlinTarget: ConfigPlugin = (config) =>
  withProjectBuildGradle(config, (gradle) => {
    if (!gradle.modResults.contents.includes(MARKER)) {
      gradle.modResults.contents += BLOCK;
    }
    return gradle;
  });

export default withKotlinTarget;
