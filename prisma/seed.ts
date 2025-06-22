import { PrismaClient } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Read JSON files
    const vesselsData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public/jsons/vessels.json'), 'utf8')
    );
    
    const ppReferenceData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public/jsons/pp-reference.json'), 'utf8')
    );
    
    const dailyLogEmissionsData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public/jsons/daily-log-emissions.json'), 'utf8')
    );

    console.log(`Found ${vesselsData.length} vessels`);
    console.log(`Found ${ppReferenceData.length} pp references`);
    console.log(`Found ${dailyLogEmissionsData.length} daily log emissions`);

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.dailyLogEmissions.deleteMany();
    await prisma.ppReference.deleteMany();
    await prisma.vessel.deleteMany();

    // Seed Vessels
    console.log('Seeding vessels...');
    for (const vessel of vesselsData) {
      await prisma.vessel.create({
        data: {
          Name: vessel.Name,
          IMONo: vessel.IMONo,
          VesselType: vessel.VesselType,
        },
      });
    }

    // Seed PP References
    console.log('Seeding PP references...');
    for (const ppRef of ppReferenceData) {
      await prisma.ppReference.create({
        data: {
          RowID: ppRef.RowID,
          Category: ppRef.Category,
          VesselTypeID: ppRef.VesselTypeID,
          Size: ppRef.Size.trim(), // Remove extra spaces
          Traj: ppRef.Traj.trim(), // Remove extra spaces
          a: ppRef.a,
          b: ppRef.b,
          c: ppRef.c,
          d: ppRef.d,
          e: ppRef.e,
        },
      });
    }

    // Seed Daily Log Emissions
    console.log('Seeding daily log emissions...');
    let batchSize = 100;
    for (let i = 0; i < dailyLogEmissionsData.length; i += batchSize) {
      const batch = dailyLogEmissionsData.slice(i, i + batchSize);
      
      await prisma.dailyLogEmissions.createMany({
        data: batch.map((emission: any) => ({
          EID: emission.EID,
          VesselID: emission.VesselID,
          LOGID: BigInt(emission.LOGID),
          FromUTC: new Date(emission.FromUTC),
          TOUTC: new Date(emission.TOUTC),
          MET2WCO2: emission.MET2WCO2,
          AET2WCO2: emission.AET2WCO2,
          BOT2WCO2: emission.BOT2WCO2,
          VRT2WCO2: emission.VRT2WCO2,
          TotT2WCO2: emission.TotT2WCO2,
          MEW2WCO2e: emission.MEW2WCO2e,
          AEW2WCO2e: emission.AEW2WCO2e,
          BOW2WCO2e: emission.BOW2WCO2e,
          VRW2WCO2e: emission.VRW2WCO2e,
          ToTW2WCO2: emission.ToTW2WCO2,
          MESox: emission.MESox,
          AESox: emission.AESox,
          BOSox: emission.BOSox,
          VRSox: emission.VRSox,
          TotSOx: emission.TotSOx,
          MENOx: emission.MENOx,
          AENOx: emission.AENOx,
          TotNOx: emission.TotNOx,
          MEPM10: emission.MEPM10,
          AEPM10: emission.AEPM10,
          TotPM10: emission.TotPM10,
          AERCO2T2W: emission.AERCO2T2W,
          AERCO2eW2W: emission.AERCO2eW2W,
          EEOICO2eW2W: emission.EEOICO2eW2W,
          CreatedAt: new Date(emission.CreatedAt),
          UpdatedAt: new Date(emission.UpdatedAt),
        })),
      });
      
      console.log(`Processed ${Math.min(i + batchSize, dailyLogEmissionsData.length)} / ${dailyLogEmissionsData.length} emissions`);
    }

    console.log('Database seeding completed successfully!');
    
    // Print summary
    const vesselCount = await prisma.vessel.count();
    const ppRefCount = await prisma.ppReference.count();
    const emissionsCount = await prisma.dailyLogEmissions.count();
    
    console.log(`\nSummary:`);
    console.log(`- Vessels: ${vesselCount}`);
    console.log(`- PP References: ${ppRefCount}`);
    console.log(`- Daily Log Emissions: ${emissionsCount}`);

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 