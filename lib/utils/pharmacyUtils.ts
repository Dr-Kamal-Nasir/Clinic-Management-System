// lib/utils/pharmacyUtils.ts
import {MedicineStock} from '@/lib/models/MedicineStock';
import { IMedicineStock } from '@/lib/models/MedicineStock';

export async function issueMedicine(
  medicineId: string,
  quantity: number,
  userId: string,
  prescriptionId?: string
): Promise<IMedicineStock> {
  const medicine = await MedicineStock.findById(medicineId);
  if (!medicine) {
    throw new Error('Medicine not found');
  }

  if (medicine.currentQuantity < quantity) {
    throw new Error('Insufficient stock');
  }

  medicine.currentQuantity -= quantity;
  medicine.history.push({
    date: new Date(),
    type: 'issued',
    quantity,
    changedBy: userId,
    previousQuantity: medicine.currentQuantity + quantity,
    prescriptionId,
    reason: `Issued ${quantity} units for prescription ${prescriptionId || 'N/A'}`
  });

  return medicine.save();
}

export async function restockMedicine(
  medicineId: string,
  quantity: number,
  userId: string,
  reason?: string
): Promise<IMedicineStock> {
  const medicine = await MedicineStock.findById(medicineId);
  if (!medicine) {
    throw new Error('Medicine not found');
  }

  medicine.currentQuantity += quantity;
  medicine.history.push({
    date: new Date(),
    type: 'restocked',
    quantity,
    changedBy: userId,
    previousQuantity: medicine.currentQuantity - quantity,
    reason: reason || `Restocked ${quantity} units`
  });

  return medicine.save();
}

export async function adjustMedicine(
  medicineId: string,
  newQuantity: number,
  userId: string,
  reason?: string
): Promise<IMedicineStock> {
  const medicine = await MedicineStock.findById(medicineId);
  if (!medicine) {
    throw new Error('Medicine not found');
  }

  const quantityDifference = newQuantity - medicine.currentQuantity;
  const changeType = quantityDifference < 0 ? 'issued' : 'restocked';

  medicine.currentQuantity = newQuantity;
  medicine.history.push({
    date: new Date(),
    type: changeType,
    quantity: Math.abs(quantityDifference),
    changedBy: userId,
    previousQuantity: medicine.currentQuantity,
    reason: reason || `Manual adjustment to ${newQuantity} units`
  });

  return medicine.save();
}
