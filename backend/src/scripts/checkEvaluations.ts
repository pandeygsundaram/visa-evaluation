import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkEvaluations() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visa-evaluation';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get Evaluation model
    const Evaluation = require('../models/Evaluation').default;

    // Count all evaluations
    const totalCount = await Evaluation.countDocuments();
    console.log(`\n📊 Total evaluations in DB: ${totalCount}`);

    // Get all evaluations with details
    const evaluations = await Evaluation.find()
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📋 Recent evaluations (last 10):`);
    evaluations.forEach((evaluation: any, index: number) => {
      console.log(`\n${index + 1}. Evaluation ID: ${evaluation._id}`);
      console.log(`   User ID: ${evaluation.userId}`);
      console.log(`   Country: ${evaluation.country}`);
      console.log(`   Visa Type: ${evaluation.visaType}`);
      console.log(`   Status: ${evaluation.status}`);
      console.log(`   Created At: ${evaluation.createdAt}`);
      console.log(`   Documents: ${evaluation.documents?.length || 0}`);
    });

    // Group by userId
    const byUser = await Evaluation.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          evaluations: {
            $push: {
              id: '$_id',
              country: '$country',
              status: '$status',
              createdAt: '$createdAt'
            }
          }
        }
      }
    ]);

    console.log(`\n👥 Evaluations by user:`);
    byUser.forEach((user: any) => {
      console.log(`\nUser ID: ${user._id}`);
      console.log(`Count: ${user.count}`);
      user.evaluations.forEach((e: any) => {
        console.log(`  - ${e.country} (${e.status}) - ${e.createdAt}`);
      });
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEvaluations();
