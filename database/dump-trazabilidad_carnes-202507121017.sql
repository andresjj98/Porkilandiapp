/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.7.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: trazabilidad_carnes
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `canales`
--

DROP TABLE IF EXISTS `canales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `canales` (
  `id_canal` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_canal` varchar(100) NOT NULL,
  `id_factura` int(11) NOT NULL,
  `peso` decimal(10,2) NOT NULL,
  `id_tipo_carne` int(11) NOT NULL,
  `id_tipo_corte` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_canal`),
  KEY `id_factura` (`id_factura`),
  KEY `fk_canales_tipo_carne` (`id_tipo_carne`),
  KEY `fk_canales_tipo_corte` (`id_tipo_corte`),
  CONSTRAINT `canales_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id_factura`),
  CONSTRAINT `fk_canales_tipo_carne` FOREIGN KEY (`id_tipo_carne`) REFERENCES `tipo_carne` (`id_tipo_carne`) ON UPDATE CASCADE,
  CONSTRAINT `fk_canales_tipo_corte` FOREIGN KEY (`id_tipo_corte`) REFERENCES `tipos_corte` (`id_tipo_corte`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canales`
--

LOCK TABLES `canales` WRITE;
/*!40000 ALTER TABLE `canales` DISABLE KEYS */;
INSERT INTO `canales` VALUES
(39,'xpt01',36,100.00,1,NULL),
(40,'xpt02',36,95.00,1,NULL),
(41,'xpt03',36,85.00,1,NULL);
/*!40000 ALTER TABLE `canales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `desposte_canales`
--

DROP TABLE IF EXISTS `desposte_canales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `desposte_canales` (
  `id_desposte_canales` int(11) NOT NULL AUTO_INCREMENT,
  `id_desposte` int(11) NOT NULL,
  `id_canal` int(11) NOT NULL,
  PRIMARY KEY (`id_desposte_canales`),
  KEY `id_desposte` (`id_desposte`),
  KEY `id_canal` (`id_canal`),
  CONSTRAINT `desposte_canales_ibfk_1` FOREIGN KEY (`id_desposte`) REFERENCES `despostes` (`id_desposte`) ON DELETE CASCADE,
  CONSTRAINT `desposte_canales_ibfk_2` FOREIGN KEY (`id_canal`) REFERENCES `canales` (`id_canal`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `desposte_canales`
--

LOCK TABLES `desposte_canales` WRITE;
/*!40000 ALTER TABLE `desposte_canales` DISABLE KEYS */;
/*!40000 ALTER TABLE `desposte_canales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despostes`
--

DROP TABLE IF EXISTS `despostes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `despostes` (
  `id_desposte` int(11) NOT NULL AUTO_INCREMENT,
  `id_factura` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `fecha` date NOT NULL,
  PRIMARY KEY (`id_desposte`),
  KEY `id_factura` (`id_factura`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `despostes_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id_factura`),
  CONSTRAINT `despostes_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despostes`
--

LOCK TABLES `despostes` WRITE;
/*!40000 ALTER TABLE `despostes` DISABLE KEYS */;
/*!40000 ALTER TABLE `despostes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_orden`
--

DROP TABLE IF EXISTS `detalle_orden`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_orden` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_orden` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `peso_total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_orden` (`id_orden`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_orden_ibfk_1` FOREIGN KEY (`id_orden`) REFERENCES `ordenes` (`id_orden`),
  CONSTRAINT `detalle_orden_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_orden`
--

LOCK TABLES `detalle_orden` WRITE;
/*!40000 ALTER TABLE `detalle_orden` DISABLE KEYS */;
INSERT INTO `detalle_orden` VALUES
(12,13,14,2,20.00);
/*!40000 ALTER TABLE `detalle_orden` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_corte`
--

DROP TABLE IF EXISTS `detalles_corte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalles_corte` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_desposte` int(11) NOT NULL,
  `id_tipo_corte` int(11) NOT NULL,
  `peso` decimal(10,2) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  PRIMARY KEY (`id_detalle`),
  KEY `id_desposte` (`id_desposte`),
  KEY `id_tipo_corte` (`id_tipo_corte`),
  CONSTRAINT `detalles_corte_ibfk_1` FOREIGN KEY (`id_desposte`) REFERENCES `despostes` (`id_desposte`),
  CONSTRAINT `detalles_corte_ibfk_3` FOREIGN KEY (`id_tipo_corte`) REFERENCES `tipos_corte` (`id_tipo_corte`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_corte`
--

LOCK TABLES `detalles_corte` WRITE;
/*!40000 ALTER TABLE `detalles_corte` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalles_corte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facturas`
--

DROP TABLE IF EXISTS `facturas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `facturas` (
  `id_factura` int(11) NOT NULL AUTO_INCREMENT,
  `numero_guia` varchar(100) NOT NULL,
  `fecha` date NOT NULL,
  `fecha_sacrificio` date DEFAULT NULL,
  `id_proveedor` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  PRIMARY KEY (`id_factura`),
  KEY `id_proveedor` (`id_proveedor`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facturas`
--

LOCK TABLES `facturas` WRITE;
/*!40000 ALTER TABLE `facturas` DISABLE KEYS */;
INSERT INTO `facturas` VALUES
(36,'ptest01','2025-07-11','2025-07-10',1,2);
/*!40000 ALTER TABLE `facturas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario`
--

DROP TABLE IF EXISTS `inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario` (
  `id_inventario` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `peso_total` decimal(10,2) NOT NULL,
  `estado` enum('disponible','comprometido','despachado') DEFAULT 'disponible',
  `origen` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_inventario`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `inventario_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario`
--

LOCK TABLES `inventario` WRITE;
/*!40000 ALTER TABLE `inventario` DISABLE KEYS */;
INSERT INTO `inventario` VALUES
(28,14,2,19.50,'despachado','orden:13'),
(29,14,0,0.00,'despachado','orden:13');
/*!40000 ALTER TABLE `inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes`
--

DROP TABLE IF EXISTS `ordenes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordenes` (
  `id_orden` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_orden` date NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_pos` int(11) DEFAULT NULL,
  `estado` enum('pendiente','enviada','entregada') DEFAULT 'pendiente',
  `codigo_orden` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_orden`),
  KEY `id_usuario` (`id_usuario`),
  KEY `fk_orden_pos` (`id_pos`),
  CONSTRAINT `fk_orden_pos` FOREIGN KEY (`id_pos`) REFERENCES `puntos_venta` (`id_punto_venta`),
  CONSTRAINT `ordenes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes`
--

LOCK TABLES `ordenes` WRITE;
/*!40000 ALTER TABLE `ordenes` DISABLE KEYS */;
INSERT INTO `ordenes` VALUES
(13,'2025-07-11',9,1,'entregada','venta01');
/*!40000 ALTER TABLE `ordenes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `id_tipo_carne` int(11) NOT NULL,
  `id_tipo_corte` int(11) NOT NULL,
  PRIMARY KEY (`id_producto`),
  KEY `fk_producto_tipo_carne` (`id_tipo_carne`),
  KEY `fk_producto_tipo_corte` (`id_tipo_corte`),
  CONSTRAINT `fk_producto_tipo_carne` FOREIGN KEY (`id_tipo_carne`) REFERENCES `tipo_carne` (`id_tipo_carne`) ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_tipo_corte` FOREIGN KEY (`id_tipo_corte`) REFERENCES `tipos_corte` (`id_tipo_corte`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES
(8,2,73),
(9,1,74),
(13,2,78),
(14,2,79),
(15,2,80),
(16,1,81),
(17,1,82),
(18,1,83),
(19,1,84);
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_proveedor`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES
(1,'Proveedor A','proveedora@gmail.com'),
(2,'Proveedor B','proveedorb@gmail.com');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `puntos_venta`
--

DROP TABLE IF EXISTS `puntos_venta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `puntos_venta` (
  `id_punto_venta` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_punto_venta`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `puntos_venta`
--

LOCK TABLES `puntos_venta` WRITE;
/*!40000 ALTER TABLE `puntos_venta` DISABLE KEYS */;
INSERT INTO `puntos_venta` VALUES
(1,'Tienda Norte','Calle 123'),
(2,'Tienda Sur','Avenida 456');
/*!40000 ALTER TABLE `puntos_venta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'admin'),
(2,'operario'),
(3,'punto_venta');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_carne`
--

DROP TABLE IF EXISTS `tipo_carne`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_carne` (
  `id_tipo_carne` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id_tipo_carne`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_carne`
--

LOCK TABLES `tipo_carne` WRITE;
/*!40000 ALTER TABLE `tipo_carne` DISABLE KEYS */;
INSERT INTO `tipo_carne` VALUES
(2,'Cerdo'),
(1,'Res');
/*!40000 ALTER TABLE `tipo_carne` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_corte`
--

DROP TABLE IF EXISTS `tipos_corte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_corte` (
  `id_tipo_corte` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_corte` varchar(100) NOT NULL,
  PRIMARY KEY (`id_tipo_corte`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_corte`
--

LOCK TABLES `tipos_corte` WRITE;
/*!40000 ALTER TABLE `tipos_corte` DISABLE KEYS */;
INSERT INTO `tipos_corte` VALUES
(73,'LOMO CAÑON'),
(74,'AGUJA CONDIMENTADA'),
(78,'SOOLOMITOS'),
(79,'PIERNA DE CERDO'),
(80,'BRAZO DE CERDO'),
(81,'AGUJA NATURAL'),
(82,'AGUJAS NEGRAS'),
(83,'BOLA CONDIMENTADA'),
(84,'BOLAS BLANCAS');
/*!40000 ALTER TABLE `tipos_corte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `numero_id` varchar(30) DEFAULT NULL,
  `username` varchar(60) NOT NULL,
  `correo` varchar(120) DEFAULT NULL,
  `contraseña` varchar(255) NOT NULL,
  `rol_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `nombre_usuario` (`username`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `correo` (`correo`),
  KEY `fk_usuario_rol` (`rol_id`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,'Juan','Pérez','admin',NULL,'$2b$10$txfPoJHrwbFRAOB.2idKjuwdy4kaPx3W0zorejMkKrtemrTR3f8O2',1),
(2,'Pedro','Gómez','operario1',NULL,'user1234',2),
(4,'Andr�s','Josa','andrej',NULL,'$2b$10$CRuVSV0GxCmnMRJiE.S2L.PCMQShZGvcr.G8lh6.VELcIEAkej6pS',1),
(9,'Jose Luis Perales','111099233','joseperales','joseperales@gmail.com','$2b$10$dtB1vqwKxxUWNqGYyNJjzuSqOC.VIwSGq7mCksl7GFGBSwRPS44Hm',2),
(12,'operario prueba','09877876','operario','opererio@prueba.com','$2b$10$uoehpqaG9UzYFwEAUafVm.qV61t8oyfqbTapcEre6yxACn3pk.yQW',2),
(14,'Andres Josa','1085338','andresjosa','andres@gmal.com','$2b$10$tPQzfW2/KZmMTSEIGTwXGedPEOoIfTH2zbjT2hi38DRVWiyH7OdUy',2);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'trazabilidad_carnes'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-07-12 10:17:26
