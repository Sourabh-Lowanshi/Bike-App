/**
 * Seed script — populates demo data for BlackPearl.
 * Run with: npm run seed
 */
import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../src/models/User";
import { Bike } from "../src/models/Bike";
import { FuelEntry } from "../src/models/FuelEntry";
import { Maintenance } from "../src/models/Maintenance";
import { Trip } from "../src/models/Trip";
import { calculateMileage } from "../src/lib/mileage";

config({ path: ".env.local" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set — copy .env.example to .env.local first");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const email = "demo@blackpearl.app";
  await User.deleteOne({ email });
  const user = await User.create({ name: "Demo Rider", email });

  await Bike.deleteMany({ userId: user._id });
  const bike = await Bike.create({
    userId: user._id,
    bikeName: "BlackPearl",
    bikeModel: "Apache RTR 160 4V",
    brand: "TVS",
    color: "Black",
    tankCapacity: 12,
    fuelType: "Petrol",
    purchaseDate: new Date("2024-01-15"),
    currentOdometer: 4200,
    registrationNumber: "MP09AB1234",
    isDefault: true,
  });

  await FuelEntry.deleteMany({ userId: user._id });
  let odometer = 3000;
  let previousOdometer: number | null = null;
  const fuelEntries = [];
  for (let i = 0; i < 12; i++) {
    const liters = 5 + Math.random() * 2;
    odometer += 180 + Math.random() * 80;
    const { distanceSinceLastFill, mileage } = calculateMileage(odometer, liters, previousOdometer);
    const pricePerLiter = 102 + Math.random() * 4;
    const date = new Date();
    date.setDate(date.getDate() - (12 - i) * 6);

    fuelEntries.push({
      userId: user._id,
      bikeId: bike._id,
      date,
      liters: Number(liters.toFixed(2)),
      amount: Number((liters * pricePerLiter).toFixed(2)),
      pricePerLiter: Number(pricePerLiter.toFixed(2)),
      odometerReading: Math.round(odometer),
      distanceSinceLast: distanceSinceLastFill,
      mileage: mileage ?? undefined,
      fuelStationName: "Indian Oil, MG Road",
      latitude: 22.7196 + (Math.random() - 0.5) * 0.02,
      longitude: 75.8577 + (Math.random() - 0.5) * 0.02,
    });
    previousOdometer = Math.round(odometer);
  }
  await FuelEntry.insertMany(fuelEntries);

  await Maintenance.deleteMany({ userId: user._id });
  await Maintenance.insertMany([
    { userId: user._id, bikeId: bike._id, title: "Full Service", category: "Service", amount: 1450, odometer: 3200, date: new Date("2024-06-01") },
    { userId: user._id, bikeId: bike._id, title: "Chain Lube", category: "Chain Lube", amount: 150, odometer: 3600, date: new Date("2024-07-10") },
    { userId: user._id, bikeId: bike._id, title: "Insurance Renewal", category: "Insurance", amount: 2800, odometer: 3800, date: new Date("2024-08-01") },
    { userId: user._id, bikeId: bike._id, title: "Bike Wash", category: "Wash", amount: 100, odometer: 4000, date: new Date("2024-09-05") },
  ]);

  await Trip.deleteMany({ userId: user._id });
  const trips = [];
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const distance = 5 + Math.random() * 15;
    const duration = distance * 120; // ~30km/h avg in seconds
    trips.push({
      userId: user._id,
      bikeId: bike._id,
      startLocation: { lat: 22.7196, lng: 75.8577, name: "Home" },
      endLocation: { lat: 22.73, lng: 75.87, name: "Office" },
      distance: Number(distance.toFixed(2)),
      duration: Math.round(duration),
      averageSpeed: Number(((distance / (duration / 3600))).toFixed(1)),
      status: "completed",
      date,
    });
  }
  await Trip.insertMany(trips);

  console.log("Seed complete:");
  console.log(`  User: ${user.email}`);
  console.log(`  Bike: ${bike.bikeName} @ ${bike.currentOdometer} km`);
  console.log(`  Fuel entries: ${fuelEntries.length}`);
  console.log(`  Trips: ${trips.length}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
