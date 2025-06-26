package Common

/**
 * 获取系统的环境变量
 *
 * 需要配置 dockerfile、gitlab-ci.yml 才能获取到当前的环境信息（分支信息）
 * 可参考 clinic-hub / clinic-server 的配置
 *
 * - gitlab-ci.yml => --build-arg CI_COMMIT_BRANCH="${CI_COMMIT_BRANCH}"
 * - dockerfile => ARG CI_COMMIT_BRANCH; ENV CI_COMMIT_BRANCH=${CI_COMMIT_BRANCH}
 *
 */
object EnvUtils {

  val k8sEnvKey = "CI_COMMIT_BRANCH"

  val localEnv = "localhost"
  val test1Env = "test1"
  val masterEnv = "master"
  val devEnv = "dev"

  val defaultEnv = "localhost"
  val featEnvPrefix = "feat"

  def getEnv: String = getEnvVar(k8sEnvKey, defaultEnv)
  def getEnv(defaultEnv: String): String = getEnvVar(k8sEnvKey, defaultEnv)
  def getEnvVar(keyName: String, defaultVal: String): String = System.getenv().getOrDefault(keyName, defaultVal)

  def isFeatBranch: Boolean = getEnv.startsWith(featEnvPrefix)

}
