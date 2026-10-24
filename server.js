
const express = require('express');
const fs = require('fs');
const path = require('path');

// Configuracion principal del servidor JACRYMO.
const app = express();
const PORT = 3000;

// Ubicacion de los archivos del proyecto.
const carpetaDatos = path.join(__dirname, 'data');
const archivoProductos = path.join(carpetaDatos, 'productos.json');
const carpetaPublica = path.join(__dirname, 'public');

// Crea la carpeta y el archivo de datos si no existen.
if (!fs.existsSync(carpetaDatos)) {
  fs.mkdirSync(carpetaDatos, { recursive: true });
}

if (!fs.existsSync(archivoProductos)) {
  fs.writeFileSync(archivoProductos, '[]', 'utf8');
}

// Permite recibir datos enviados desde formularios y solicitudes JSON.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Muestra la interfaz web ubicada en la carpeta public.
app.use(express.static(carpetaPublica));

// Lee los productos guardados en el archivo JSON.
function leerProductos() {
  const contenido = fs.readFileSync(archivoProductos, 'utf8');
  return JSON.parse(contenido);
}

// Guarda los productos en el archivo JSON.
function guardarProductos(productos) {
  fs.writeFileSync(
    archivoProductos,
    JSON.stringify(productos, null, 2),
    'utf8'
  );
}

// Valida los datos recibidos de un producto.
function validarProducto(nombre, precio, stock) {
  return (
    typeof nombre === 'string' &&
    nombre.trim() !== '' &&
    precio !== undefined &&
    precio !== null &&
    String(precio).trim() !== '' &&
    Number.isFinite(Number(precio)) &&
    Number(precio) > 0 &&
    stock !== undefined &&
    stock !== null &&
    String(stock).trim() !== '' &&
    Number.isInteger(Number(stock)) &&
    Number(stock) >= 0
  );
}

// CONSULTAR: obtiene todos los productos registrados.
app.get('/api/productos', (req, res) => {
  try {
    res.json(leerProductos());
  } catch (error) {
    console.error('Error al consultar productos:', error.message);
    res.status(500).json({
      mensaje: 'Error al consultar los productos.'
    });
  }
});

// REGISTRAR: agrega un producto nuevo al inventario.
app.post('/api/productos', (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    if (!validarProducto(nombre, precio, stock)) {
      return res.status(400).json({
        mensaje: 'Ingrese un nombre, un precio positivo y un stock entero no negativo.'
      });
    }

    const productos = leerProductos();

    const nuevoProducto = {
      idProducto:
        productos.length > 0
          ? Math.max(...productos.map((producto) => producto.idProducto)) + 1
          : 1,
      nombre: nombre.trim(),
      precio: Number(precio),
      stock: Number(stock)
    };

    productos.push(nuevoProducto);
    guardarProductos(productos);

    res.status(201).json({
      mensaje: 'Producto registrado correctamente.',
      producto: nuevoProducto
    });
  } catch (error) {
    console.error('Error al registrar producto:', error.message);
    res.status(500).json({
      mensaje: 'Error al registrar el producto.'
    });
  }
});

// ACTUALIZAR: modifica un producto existente.
app.put('/api/productos/:id', (req, res) => {
  try {
    const idProducto = Number(req.params.id);
    const { nombre, precio, stock } = req.body;

    if (
      !Number.isInteger(idProducto) ||
      idProducto < 1 ||
      !validarProducto(nombre, precio, stock)
    ) {
      return res.status(400).json({
        mensaje: 'Verifique el identificador y los datos del producto.'
      });
    }

    const productos = leerProductos();

    const indice = productos.findIndex(
      (producto) => producto.idProducto === idProducto
    );

    if (indice === -1) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado.'
      });
    }

    productos[indice] = {
      idProducto,
      nombre: nombre.trim(),
      precio: Number(precio),
      stock: Number(stock)
    };

    guardarProductos(productos);

    res.json({
      mensaje: 'Producto actualizado correctamente.',
      producto: productos[indice]
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({
      mensaje: 'Error al actualizar el producto.'
    });
  }
});

// ELIMINAR: retira un producto del inventario.
app.delete('/api/productos/:id', (req, res) => {
  try {
    const idProducto = Number(req.params.id);

    if (!Number.isInteger(idProducto) || idProducto < 1) {
      return res.status(400).json({
        mensaje: 'El identificador del producto no es valido.'
      });
    }

    const productos = leerProductos();

    const productosActualizados = productos.filter(
      (producto) => producto.idProducto !== idProducto
    );

    if (productos.length === productosActualizados.length) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado.'
      });
    }

    guardarProductos(productosActualizados);

    res.json({
      mensaje: 'Producto eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error.message);
    res.status(500).json({
      mensaje: 'Error al eliminar el producto.'
    });
  }
});

// Inicia el servidor web.
app.listen(PORT, () => {
  console.log(`Servidor JACRYMO ejecutandose en http://localhost:${PORT}`);
});
