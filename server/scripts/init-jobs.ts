import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const jobsData = [
  {
    title: '高级前端工程师 - React',
    description: '我们正在寻找一位经验丰富的前端工程师，负责开发和维护我们的企业级Web应用。您将与产品团队紧密合作，打造优秀的用户体验。',
    requirements: `- 5年以上前端开发经验
- 精通React、TypeScript、Tailwind CSS
- 熟悉Webpack、Vite等构建工具
- 有大型SPA项目经验
- 良好的代码质量意识和团队协作能力`,
    location: '北京市朝阳区',
    salaryRange: '25k-40k',
    status: 'PUBLISHED',
  },
  {
    title: '全栈开发工程师 - Node.js',
    description: '加入我们的创新团队，使用现代技术栈开发下一代SaaS产品。我们提供灵活的工作环境和有竞争力的薪酬。',
    requirements: `- 3年以上全栈开发经验
- 精通Node.js、Express、Prisma
- 熟悉React或Vue前端框架
- 了解PostgreSQL/MySQL数据库
- 有RESTful API和GraphQL开发经验`,
    location: '上海市浦东新区',
    salaryRange: '20k-35k',
    status: 'PUBLISHED',
  },
  {
    title: 'DevOps工程师 - AWS/Azure',
    description: '负责构建和维护CI/CD流程，确保应用的高可用性和可扩展性。与开发团队紧密合作，优化部署流程。',
    requirements: `- 3年以上DevOps经验
- 熟悉AWS或Azure云平台
- 精通Docker、Kubernetes
- 了解Terraform、Ansible等IaC工具
- 有监控和日志分析经验`,
    location: '深圳市南山区',
    salaryRange: '25k-45k',
    status: 'PUBLISHED',
  },
  {
    title: '数据工程师 - 大数据平台',
    description: '构建和优化数据管道，支持公司的数据驱动决策。处理PB级数据，确保数据质量和可靠性。',
    requirements: `- 3年以上数据工程经验
- 精通Spark、Hadoop、Kafka
- 熟悉Python、Scala
- 了解数据仓库设计
- 有实时数据处理经验`,
    location: '杭州市西湖区',
    salaryRange: '30k-50k',
    status: 'PUBLISHED',
  },
  {
    title: 'AI/机器学习工程师',
    description: '开发和部署机器学习模型，为产品提供智能化能力。参与从数据准备到模型上线的完整流程。',
    requirements: `- 硕士及以上学历
- 3年以上机器学习经验
- 精通Python、TensorFlow/PyTorch
- 熟悉NLP或CV领域
- 有大模型训练和部署经验优先`,
    location: '北京市海淀区',
    salaryRange: '35k-60k',
    status: 'PUBLISHED',
  },
  {
    title: 'iOS开发工程师',
    description: '负责开发和维护iOS应用，提供流畅的移动端用户体验。与设计团队合作，实现精美的界面和交互。',
    requirements: `- 3年以上iOS开发经验
- 精通Swift、Objective-C
- 熟悉UIKit、SwiftUI
- 了解App Store发布流程
- 有性能优化经验`,
    location: '广州市天河区',
    salaryRange: '20k-35k',
    status: 'PUBLISHED',
  },
  {
    title: 'Android开发工程师',
    description: '开发高质量的Android应用，支持数百万用户。关注性能、稳定性和用户体验。',
    requirements: `- 3年以上Android开发经验
- 精通Kotlin、Java
- 熟悉Jetpack组件
- 了解Material Design
- 有大型应用开发经验`,
    location: '成都市高新区',
    salaryRange: '18k-32k',
    status: 'PUBLISHED',
  },
  {
    title: '后端开发工程师 - Java',
    description: '负责核心业务系统的开发和维护，处理高并发场景。优化系统性能，确保服务稳定性。',
    requirements: `- 5年以上Java开发经验
- 精通Spring Boot、Spring Cloud
- 熟悉微服务架构
- 了解Redis、RabbitMQ
- 有高并发系统经验`,
    location: '南京市江宁区',
    salaryRange: '25k-42k',
    status: 'PUBLISHED',
  },
  {
    title: '测试开发工程师',
    description: '构建自动化测试框架，提升产品质量。参与整个软件开发生命周期，确保交付高质量的产品。',
    requirements: `- 3年以上测试开发经验
- 精通Python、Java
- 熟悉Selenium、Appium
- 了解CI/CD流程
- 有性能测试经验`,
    location: '武汉市光谷',
    salaryRange: '18k-30k',
    status: 'PUBLISHED',
  },
  {
    title: '产品经理 - B端产品',
    description: '负责企业级SaaS产品的规划和设计，深入理解客户需求，推动产品创新和迭代。',
    requirements: `- 3年以上B端产品经验
- 熟悉SaaS产品设计
- 有数据分析能力
- 良好的沟通协调能力
- 了解Agile开发流程`,
    location: '上海市徐汇区',
    salaryRange: '22k-38k',
    status: 'PUBLISHED',
  },
  {
    title: 'UI/UX设计师',
    description: '设计美观且易用的界面，提升用户体验。与产品和开发团队紧密合作，确保设计落地。',
    requirements: `- 3年以上UI/UX设计经验
- 精通Figma、Sketch
- 有移动端和Web设计经验
- 了解设计系统
- 良好的审美和创意能力`,
    location: '北京市朝阳区',
    salaryRange: '18k-32k',
    status: 'PUBLISHED',
  },
  {
    title: '安全工程师',
    description: '负责系统安全防护，识别和修复安全漏洞。制定安全策略，保护公司和用户数据安全。',
    requirements: `- 3年以上安全经验
- 熟悉常见安全漏洞和防护
- 了解渗透测试
- 有应急响应经验
- CISSP或CEH证书优先`,
    location: '深圳市福田区',
    salaryRange: '25k-45k',
    status: 'PUBLISHED',
  },
  {
    title: '区块链开发工程师',
    description: '开发去中心化应用（DApp），参与智能合约设计和实现。探索区块链技术在业务中的应用。',
    requirements: `- 2年以上区块链开发经验
- 精通Solidity、Web3.js
- 熟悉以太坊、Polygon
- 了解DeFi、NFT
- 有智能合约审计经验优先`,
    location: '新加坡 / 远程',
    salaryRange: '30k-55k',
    status: 'PUBLISHED',
  },
  {
    title: '游戏开发工程师 - Unity',
    description: '开发创新的移动游戏，为玩家带来优质体验。参与游戏玩法设计和技术实现。',
    requirements: `- 3年以上Unity开发经验
- 精通C#、Unity引擎
- 熟悉游戏优化
- 有完整游戏上线经验
- 热爱游戏，有创造力`,
    location: '上海市长宁区',
    salaryRange: '20k-38k',
    status: 'PUBLISHED',
  },
  {
    title: '运维工程师',
    description: '维护生产环境的稳定运行，处理突发故障。优化系统性能，提升服务可用性。',
    requirements: `- 3年以上运维经验
- 熟悉Linux系统
- 精通Shell、Python脚本
- 了解Nginx、MySQL
- 有7x24小时值班经验`,
    location: '北京市海淀区',
    salaryRange: '18k-30k',
    status: 'PUBLISHED',
  },
  {
    title: '技术支持工程师',
    description: '为客户提供技术支持，解决产品使用中的问题。收集用户反馈，协助产品改进。',
    requirements: `- 1年以上技术支持经验
- 熟悉常见技术问题排查
- 良好的沟通能力
- 有耐心和服务意识
- 英语口语流利优先`,
    location: '广州市越秀区',
    salaryRange: '12k-20k',
    status: 'PUBLISHED',
  },
  {
    title: '架构师',
    description: '负责系统架构设计和技术选型，解决复杂的技术难题。指导团队进行技术实践，推动技术创新。',
    requirements: `- 8年以上开发经验
- 精通分布式系统设计
- 有大型系统架构经验
- 熟悉微服务、云原生
- 优秀的技术领导力`,
    location: '北京市朝阳区',
    salaryRange: '50k-80k',
    status: 'PUBLISHED',
  },
  {
    title: '数据分析师',
    description: '分析业务数据，提供数据驱动的决策建议。构建数据看板，监控关键业务指标。',
    requirements: `- 2年以上数据分析经验
- 精通SQL、Python
- 熟悉Tableau、PowerBI
- 有统计学基础
- 良好的业务理解能力`,
    location: '杭州市滨江区',
    salaryRange: '15k-28k',
    status: 'PUBLISHED',
  },
  {
    title: '算法工程师 - 推荐系统',
    description: '开发和优化推荐算法，提升用户体验和业务指标。处理海量数据，探索新的推荐策略。',
    requirements: `- 3年以上算法经验
- 精通推荐系统算法
- 熟悉Python、Spark
- 有A/B测试经验
- 硕士及以上学历优先`,
    location: '北京市海淀区',
    salaryRange: '30k-55k',
    status: 'PUBLISHED',
  },
  {
    title: '前端架构师',
    description: '负责前端技术体系建设，制定技术规范和最佳实践。推动前端工程化，提升开发效率。',
    requirements: `- 6年以上前端开发经验
- 精通React、Vue生态
- 有前端架构设计经验
- 熟悉工程化工具链
- 优秀的技术影响力`,
    location: '深圳市南山区',
    salaryRange: '40k-70k',
    status: 'PUBLISHED',
  },
];

async function initJobs() {
  try {
    console.log('🚀 Starting job initialization...\n');

    // Find or create an admin user to own these jobs
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating default admin...');
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@readysethire.com',
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created\n');
    }

    // Check if jobs already exist
    const existingJobsCount = await prisma.job.count();
    if (existingJobsCount > 0) {
      console.log(`⚠️  Found ${existingJobsCount} existing jobs.`);
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('Do you want to delete existing jobs and create new ones? (yes/no): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('🗑️  Deleting existing jobs...');
        await prisma.job.deleteMany({});
        console.log('✅ Existing jobs deleted\n');
      } else {
        console.log('❌ Operation cancelled');
        return;
      }
    }

    // Create jobs
    console.log(`📝 Creating ${jobsData.length} jobs...\n`);
    
    let createdCount = 0;
    for (const jobData of jobsData) {
      const job = await prisma.job.create({
        data: {
          ...jobData,
          userId: adminUser.id,
          publishedAt: jobData.status === 'PUBLISHED' ? new Date() : null,
        },
      });
      createdCount++;
      console.log(`  ✓ Created: ${job.title} (${job.location})`);
    }

    console.log(`\n✅ Successfully created ${createdCount} jobs!`);
    console.log('\n📊 Summary:');
    console.log(`  - Total jobs: ${createdCount}`);
    console.log(`  - Published jobs: ${jobsData.filter(j => j.status === 'PUBLISHED').length}`);
    console.log(`  - Draft jobs: ${jobsData.filter(j => j.status === 'DRAFT').length}`);
    console.log(`\n🎉 Job initialization completed!`);

  } catch (error) {
    console.error('❌ Error initializing jobs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initJobs().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
