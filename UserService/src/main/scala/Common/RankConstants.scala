package Common

object RankConstants {
  // 段位定义
  case class Rank(
    name: String,
    minCredits: Int
  )

  // 所有段位列表，按积分从低到高排序
  // 注意：添加新段位只需在此列表中按积分要求顺序插入即可
  val AllRanks: List[Rank] = List(
    Rank("黑铁", 0),
    Rank("青铜", 100),
    Rank("白银", 200),
    Rank("黄金", 300),
    Rank("铂金", 400),
    Rank("钻石", 500),
    Rank("木星人", 600),
    Rank("Milky Way", 700)
  )

  // 根据积分获取对应段位和位置
  def getRankInfoByCredits(credits: Int): (Rank, Int) = {
    // 找到第一个最小积分要求大于当前积分的段位的索引
    val nextRankIndex = AllRanks.indexWhere(_.minCredits > credits)
    
    if (nextRankIndex == -1) {
      // 如果没找到，说明积分达到或超过了最高段位
      (AllRanks.last, AllRanks.length - 1)
    } else if (nextRankIndex == 0) {
      // 如果是第一个，说明积分低于最低段位要求
      (AllRanks.head, 0)
    } else {
      // 否则取前一个段位
      (AllRanks(nextRankIndex - 1), nextRankIndex - 1)
    }
  }
} 