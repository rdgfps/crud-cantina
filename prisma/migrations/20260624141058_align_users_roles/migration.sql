/*
  Warnings:

  - You are about to drop the column `passwordResetExpires` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetToken` on the `usuarios` table. All the data in the column will be lost.
  - You are about to alter the column `nivel` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `logs` ADD COLUMN `descricao` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `usuarios` DROP COLUMN `passwordResetExpires`,
    DROP COLUMN `passwordResetToken`,
    ADD COLUMN `recoveryCode` VARCHAR(255) NULL,
    ADD COLUMN `recoveryExpiresAt` DATETIME(3) NULL,
    MODIFY `nivel` ENUM('ADMIN', 'GERENTE', 'OPERADOR') NOT NULL DEFAULT 'OPERADOR';
