-- SoundGuard Database Schema
-- Tables for storing machine health data, alerts, and analysis results

CREATE TABLE IF NOT EXISTS machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  machineType VARCHAR(100),
  location VARCHAR(255),
  serialNumber VARCHAR(100),
  status ENUM('healthy', 'caution', 'alert') DEFAULT 'healthy',
  healthScore INT DEFAULT 100,
  lastAnalyzed TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS acoustic_analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machineId INT NOT NULL,
  userId INT NOT NULL,
  audioUrl VARCHAR(500),
  anomalyScore FLOAT,
  confidence FLOAT,
  isAnomaly BOOLEAN DEFAULT FALSE,
  issueType VARCHAR(100),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  recommendation TEXT,
  costNow INT,
  costLater INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machineId INT NOT NULL,
  userId INT NOT NULL,
  maintenanceType VARCHAR(100),
  description TEXT,
  costSpent INT,
  downtime INT,
  performedBy VARCHAR(255),
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  scheduledDate TIMESTAMP,
  completedDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machineId INT NOT NULL,
  userId INT NOT NULL,
  alertType VARCHAR(100),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  message TEXT,
  isResolved BOOLEAN DEFAULT FALSE,
  resolvedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS health_trends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machineId INT NOT NULL,
  userId INT NOT NULL,
  healthScore INT,
  anomalyCount INT DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machineId) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_machines_userId ON machines(userId);
CREATE INDEX idx_acoustic_analyses_machineId ON acoustic_analyses(machineId);
CREATE INDEX idx_acoustic_analyses_userId ON acoustic_analyses(userId);
CREATE INDEX idx_maintenance_history_machineId ON maintenance_history(machineId);
CREATE INDEX idx_alerts_machineId ON alerts(machineId);
CREATE INDEX idx_health_trends_machineId ON health_trends(machineId);
