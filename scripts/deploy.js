const hre = require("hardhat");

async function main() {
  console.log("开始部署 RedEnvelope 合约...");

  // 获取合约工厂
  const RedEnvelope = await hre.ethers.getContractFactory("RedEnvelope");
  
  // 部署合约
  const redEnvelope = await RedEnvelope.deploy();
  
  // 等待部署完成
  await redEnvelope.waitForDeployment();
  
  const contractAddress = await redEnvelope.getAddress();
  
  console.log(`RedEnvelope 合约已部署到: ${contractAddress}`);
  console.log(`\n请将以下地址复制到 src/hooks/useContract.ts 中的 CONTRACT_ADDRESS:`);
  console.log(`const CONTRACT_ADDRESS = "${contractAddress}";`);
  
  // 验证部署
  console.log("\n正在验证合约部署...");
  try {
    const totalEnvelopes = await redEnvelope.getTotalEnvelopes();
    console.log(`合约验证成功！当前红包总数: ${totalEnvelopes}`);
  } catch (error) {
    console.error("合约验证失败:", error);
  }
  
  console.log(`\n网络信息:`);
  console.log(`- 网络名称: ${hre.network.name}`);
  console.log(`- 链ID: ${hre.network.config.chainId}`);
  
  if (hre.network.name !== "hardhat") {
    console.log(`\n你可以在区块链浏览器中查看合约:`);
    if (hre.network.config.chainId === 11155111) {
      console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
    } else if (hre.network.config.chainId === 1) {
      console.log(`https://etherscan.io/address/${contractAddress}`);
    }
  }
}

// 运行部署脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });