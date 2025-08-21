const hre = require("hardhat");

// 替换为你部署的合约地址
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  console.log("连接到 RedEnvelope 合约...");
  
  // 获取合约实例
  const RedEnvelope = await hre.ethers.getContractFactory("RedEnvelope");
  const redEnvelope = RedEnvelope.attach(CONTRACT_ADDRESS);
  
  // 获取签名者
  const [deployer, user1, user2] = await hre.ethers.getSigners();
  
  console.log(`\n使用账户:`);
  console.log(`- 部署者: ${deployer.address}`);
  console.log(`- 用户1: ${user1.address}`);
  console.log(`- 用户2: ${user2.address}`);
  
  try {
    // 查看合约状态
    const totalEnvelopes = await redEnvelope.getTotalEnvelopes();
    console.log(`\n当前红包总数: ${totalEnvelopes}`);
    
    // 创建红包（使用部署者账户）
    console.log(`\n创建红包...`);
    const createTx = await redEnvelope.connect(deployer).createEnvelope({
      value: hre.ethers.parseEther("0.05")
    });
    await createTx.wait();
    console.log(`红包创建成功！交易哈希: ${createTx.hash}`);
    
    // 查询红包信息
    const envelopeId = 0;
    const envelope = await redEnvelope.getEnvelope(envelopeId);
    console.log(`\n红包 ${envelopeId} 信息:`);
    console.log(`- 创建者: ${envelope.creator}`);
    console.log(`- 总金额: ${hre.ethers.formatEther(envelope.totalAmount)} ETH`);
    console.log(`- 剩余金额: ${hre.ethers.formatEther(envelope.remainingAmount)} ETH`);
    console.log(`- 总红包数: ${envelope.totalPackets}`);
    console.log(`- 剩余红包数: ${envelope.remainingPackets}`);
    console.log(`- 状态: ${envelope.isActive ? '活跃' : '已结束'}`);
    
    // 用户1抢红包
    console.log(`\n用户1抢红包...`);
    const claimTx1 = await redEnvelope.connect(user1).claimEnvelope(envelopeId);
    const receipt1 = await claimTx1.wait();
    
    // 从事件中获取抢到的金额
    const claimEvent1 = receipt1.logs.find(log => {
      try {
        const parsed = redEnvelope.interface.parseLog(log);
        return parsed?.name === 'EnvelopeClaimed';
      } catch {
        return false;
      }
    });
    
    if (claimEvent1) {
      const parsed = redEnvelope.interface.parseLog(claimEvent1);
      console.log(`用户1抢到: ${hre.ethers.formatEther(parsed.args.amount)} ETH`);
    }
    
    // 用户2抢红包
    console.log(`\n用户2抢红包...`);
    const claimTx2 = await redEnvelope.connect(user2).claimEnvelope(envelopeId);
    const receipt2 = await claimTx2.wait();
    
    const claimEvent2 = receipt2.logs.find(log => {
      try {
        const parsed = redEnvelope.interface.parseLog(log);
        return parsed?.name === 'EnvelopeClaimed';
      } catch {
        return false;
      }
    });
    
    if (claimEvent2) {
      const parsed = redEnvelope.interface.parseLog(claimEvent2);
      console.log(`用户2抢到: ${hre.ethers.formatEther(parsed.args.amount)} ETH`);
    }
    
    // 查看更新后的红包信息
    const updatedEnvelope = await redEnvelope.getEnvelope(envelopeId);
    console.log(`\n更新后的红包信息:`);
    console.log(`- 剩余金额: ${hre.ethers.formatEther(updatedEnvelope.remainingAmount)} ETH`);
    console.log(`- 剩余红包数: ${updatedEnvelope.remainingPackets}`);
    console.log(`- 已领取人数: ${updatedEnvelope.claimedBy.length}`);
    console.log(`- 状态: ${updatedEnvelope.isActive ? '活跃' : '已结束'}`);
    
  } catch (error) {
    console.error("交互失败:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });