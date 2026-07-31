-- Migration 001: Add GPS Coordinates to technician_profiles and Status/Proof Image to deposits
-- Created: 2026-07-31

USE `ramah_listrik`;

-- 1. Add Latitude & Longitude to technician_profiles table
ALTER TABLE `technician_profiles` 
ADD COLUMN IF NOT EXISTS `latitude` DECIMAL(10,8) NULL AFTER `ktp_photo`,
ADD COLUMN IF NOT EXISTS `longitude` DECIMAL(11,8) NULL AFTER `latitude`;

-- 2. Add status and proof_image to deposits table
ALTER TABLE `deposits` 
ADD COLUMN IF NOT EXISTS `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' AFTER `type`,
ADD COLUMN IF NOT EXISTS `proof_image` VARCHAR(255) NULL AFTER `status`;
