-- AlterTable: allow transactions to survive branch/cashier deletion
ALTER TABLE "transactions" ALTER COLUMN "branch_id" DROP NOT NULL;
ALTER TABLE "transactions" ALTER COLUMN "cashier_id" DROP NOT NULL;

-- AlterTable: allow transaction_items to survive menu_item deletion
-- (menu_name, price, qty already stored as snapshots so data is preserved)
ALTER TABLE "transaction_items" ALTER COLUMN "menu_item_id" DROP NOT NULL;
