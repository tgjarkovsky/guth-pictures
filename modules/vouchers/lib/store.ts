import "server-only";
import { getKv } from "@/lib/kv";
import { formatVs, generateOrderId } from "./code";
import type { VoucherOrder } from "./types";

const orderKey = (id: string) => `voucher:order:${id}`;
const vsKey = (vs: string) => `voucher:vs:${vs}`;
const codeKey = (code: string) => `voucher:code:${code}`;
const INDEX = "voucher:orders";
const LOCK = "voucher:lock";

async function kvOrThrow() {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  return kv;
}

export async function createOrder(data: Omit<VoucherOrder, "id" | "vs" | "status" | "createdAt">, now = new Date()): Promise<VoucherOrder> {
  const kv = await kvOrThrow();
  const year = now.getFullYear();
  const seq = await kv.incr(`voucher:vs-seq:${year}`);
  const order: VoucherOrder = {
    ...data,
    id: generateOrderId(),
    vs: formatVs(seq, year),
    status: "pending",
    createdAt: now.toISOString(),
  };
  await kv.set(orderKey(order.id), order);
  await kv.set(vsKey(order.vs), order.id);
  await kv.lpush(INDEX, order.id);
  return order;
}

export async function getOrder(id: string): Promise<VoucherOrder | null> {
  const kv = await kvOrThrow();
  return (await kv.get<VoucherOrder>(orderKey(id))) ?? null;
}

export async function saveOrder(order: VoucherOrder): Promise<void> {
  const kv = await kvOrThrow();
  await kv.set(orderKey(order.id), order);
  if (order.code) await kv.set(codeKey(order.code), order.id);
}

export async function findOrderByVs(vs: string): Promise<VoucherOrder | null> {
  const kv = await kvOrThrow();
  const id = await kv.get<string>(vsKey(vs.replace(/^0+/, "")));
  return id ? getOrder(String(id)) : null;
}

export async function findOrderByCode(code: string): Promise<VoucherOrder | null> {
  const kv = await kvOrThrow();
  const id = await kv.get<string>(codeKey(code));
  return id ? getOrder(String(id)) : null;
}

export async function listOrders(limit = 500): Promise<VoucherOrder[]> {
  const kv = await kvOrThrow();
  const ids = await kv.lrange<string>(INDEX, 0, limit - 1);
  if (!ids.length) return [];
  const orders = await kv.mget<(VoucherOrder | null)[]>(...ids.map((id) => orderKey(String(id))));
  return orders.filter((o): o is VoucherOrder => Boolean(o));
}

export async function isCodeTaken(code: string): Promise<boolean> {
  const kv = await kvOrThrow();
  return Boolean(await kv.get(codeKey(code)));
}

/** Single-runner lock for the payment check — Fio allows one request per 30 s per token. */
export async function acquireLock(seconds = 120): Promise<boolean> {
  const kv = await kvOrThrow();
  return (await kv.set(LOCK, "1", { nx: true, ex: seconds })) === "OK";
}

export async function releaseLock(): Promise<void> {
  const kv = await kvOrThrow();
  await kv.del(LOCK);
}
