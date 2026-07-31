-- Database Schema for Ramah Listrik
CREATE DATABASE IF NOT EXISTS `ramah_listrik` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ramah_listrik`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'technician', 'customer') NOT NULL DEFAULT 'customer',
  `status` ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Technician Profiles Table
CREATE TABLE IF NOT EXISTS `technician_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `address` TEXT,
  `working_area` VARCHAR(255),
  `experience_years` INT DEFAULT 0,
  `photo` VARCHAR(255),
  `ktp_photo` VARCHAR(255),
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `is_online` TINYINT(1) NOT NULL DEFAULT 1,
  `rating_avg` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `rating_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Services Table
CREATE TABLE IF NOT EXISTS `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(12,2) NOT NULL,
  `icon` VARCHAR(100) DEFAULT 'Wrench',
  `estimated_time` VARCHAR(100) DEFAULT '1-2 jam',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_code` VARCHAR(50) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `technician_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `service_price` DECIMAL(12,2) NOT NULL,
  `admin_fee_percent` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `admin_fee_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `address` TEXT NOT NULL,
  `notes` TEXT,
  `scheduled_at` DATETIME NOT NULL,
  `status` ENUM('pending', 'accepted', 'heading_to_location', 'in_progress', 'completed', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('cash', 'transfer') NOT NULL DEFAULT 'cash',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Deposits Table
CREATE TABLE IF NOT EXISTS `deposits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `technician_id` INT NOT NULL,
  `admin_id` INT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `type` ENUM('topup', 'deduct_fee', 'manual_adjust') NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  `proof_image` VARCHAR(255) NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ratings Table
CREATE TABLE IF NOT EXISTS `ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `technician_id` INT NOT NULL,
  `rating` TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `photo` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Banners Table
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Site Settings Table
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `app_name` VARCHAR(100) NOT NULL DEFAULT 'Ramah Listrik',
  `whatsapp_number` VARCHAR(30) DEFAULT '081234567890',
  `email` VARCHAR(100) DEFAULT 'admin@ramahlistrik.com',
  `bank_account` TEXT,
  `qris_image` VARCHAR(255) DEFAULT '',
  `fee_percentage` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `operational_hours` VARCHAR(100) DEFAULT '08.00 - 20.00 WIB',
  `social_media` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Initial Seed Data
INSERT INTO `site_settings` (`id`, `app_name`, `whatsapp_number`, `email`, `bank_account`, `fee_percentage`, `operational_hours`) 
VALUES (1, 'Ramah Listrik', '081234567890', 'support@ramahlistrik.com', 'BCA: 1234567890 a.n Ramah Listrik', 10.00, '24 Jam')
ON DUPLICATE KEY UPDATE `app_name` = VALUES(`app_name`);

-- Default password is 'password123'
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `status`) VALUES
(1, 'Super Admin', 'admin@ramahlistrik.com', '08111111111', '$2a$10$X8aW4r2M7oOaZq.kG.H2ee.7P0v3Oq4Qd5hVp6n/N3v/5c8c5x5.y', 'admin', 'active'),
(2, 'Budi Teknisi', 'budi@teknisi.com', '08222222222', '$2a$10$X8aW4r2M7oOaZq.kG.H2ee.7P0v3Oq4Qd5hVp6n/N3v/5c8c5x5.y', 'technician', 'active'),
(3, 'Andi Customer', 'andi@customer.com', '08333333333', '$2a$10$X8aW4r2M7oOaZq.kG.H2ee.7P0v3Oq4Qd5hVp6n/N3v/5c8c5x5.y', 'customer', 'active');

INSERT INTO `technician_profiles` (`id`, `user_id`, `address`, `working_area`, `experience_years`, `balance`, `is_online`, `rating_avg`, `rating_count`) VALUES
(1, 2, 'Jl. Merdeka No. 45, Jakarta', 'Jakarta Selatan & Jakarta Pusat', 5, 50000.00, 1, 5.00, 1);

INSERT INTO `services` (`id`, `name`, `description`, `price`, `icon`, `estimated_time`, `is_active`) VALUES
(1, 'Servis Instalasi Ringan', 'Perbaikan saklar, stop kontak, atau fitting lampu yang bermasalah.', 75000.00, 'Zap', '1 Jam', 1),
(2, 'Pemasangan Instalasi Baru', 'Pemasangan titik lampu atau stop kontak baru per titik.', 120000.00, 'Wrench', '2-3 Jam', 1),
(3, 'Survey & Pengecekan Korsleting', 'Pemeriksaan jalur kabel utama yang menyebabkan listrik anjlok/korslet.', 100000.00, 'Search', '1-2 Jam', 1),
(4, 'Pemasangan Boot Panel / MCB', 'Penggantian MCB yang rusak atau penambahan box panel listrik.', 150000.00, 'ShieldCheck', '2 Jam', 1);
