import { useRef } from "react";

function nombreCompleto(usuario) {
  if (!usuario) return "—";
  const partes = [usuario.nombres, usuario.apellidos].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : usuario.email || "—";
}

export default function EmpleadoFactura({ pedido, onVolver }) {
  const facturaRef = useRef();

  function imprimir() {
    const contenido = facturaRef.current.innerHTML;
    const ventana = window.open("", "_blank", "width=800,height=900");
    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Factura #${pedido._id?.slice(-6).toUpperCase()}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #1a1a1a;
              background: #fff;
              padding: 40px;
              font-size: 14px;
            }
            .factura { max-width: 720px; margin: 0 auto; }
            .factura-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #c0392b;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .factura-empresa h1 {
              font-size: 26px;
              font-weight: 800;
              color: #c0392b;
              letter-spacing: 1px;
            }
            .factura-empresa p { font-size: 12px; color: #666; margin-top: 4px; }
            .factura-meta { text-align: right; }
            .factura-meta .factura-num { font-size: 18px; font-weight: 700; color: #1a1a1a; }
            .factura-meta p { font-size: 12px; color: #666; margin-top: 4px; }
            .factura-seccion { margin-bottom: 24px; }
            .factura-seccion h3 {
              font-size: 11px; font-weight: 700; text-transform: uppercase;
              letter-spacing: 1px; color: #888; margin-bottom: 8px;
              border-bottom: 1px solid #eee; padding-bottom: 4px;
            }
            .factura-cliente-info p { font-size: 13px; color: #333; line-height: 1.7; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th {
              background: #f5f5f5; text-align: left; padding: 10px 12px;
              font-size: 11px; font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.5px; color: #555;
            }
            td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
            tr:last-child td { border-bottom: none; }
            .text-right { text-align: right; }
            .factura-totales {
              margin-top: 12px; display: flex;
              flex-direction: column; align-items: flex-end; gap: 6px;
            }
            .factura-totales-fila {
              display: flex; gap: 40px; font-size: 13px; color: #555;
            }
            .factura-totales-fila span:last-child { min-width: 100px; text-align: right; }
            .factura-totales-fila--total {
              font-size: 16px; font-weight: 700; color: #1a1a1a;
              border-top: 2px solid #1a1a1a; padding-top: 8px; margin-top: 4px;
            }
            .factura-badge {
              display: inline-block; padding: 3px 10px; border-radius: 20px;
              font-size: 11px; font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.5px; background: #e8f5e9; color: #2e7d32;
            }
            .factura-footer {
              margin-top: 40px; border-top: 1px solid #eee;
              padding-top: 16px; text-align: center; font-size: 11px; color: #999;
            }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 400);
  }

  const subtotal = (pedido.items || []).reduce(
    (sum, item) => sum + (item.precioUnitario || item.precio || 0) * item.cantidad,
    0
  );
  const envio = pedido.costoEnvio || 0;
  const total = pedido.total || subtotal + envio;
  const fecha = new Date(pedido.createdAt);

  return (
    <div className="emp-seccion">
      <div className="emp-seccion-header emp-factura-acciones">
        <button className="emp-btn emp-btn--ghost" onClick={onVolver}>
          ← Volver
        </button>
        <button className="emp-btn emp-btn--primario" onClick={imprimir}>
          🖨️ Imprimir factura
        </button>
      </div>

      <div className="emp-factura-preview" ref={facturaRef}>
        <div className="factura">

          {/* Encabezado */}
          <div className="factura-header">
            <div className="factura-empresa">
              <h1>SEVE Aluminios</h1>
              <p>NIT: 900.XXX.XXX-X</p>
              <p>Bogotá, Colombia · seve@aluminios.com</p>
              <p>Tel: +57 322 887 7166</p>
            </div>
            <div className="factura-meta">
              <div className="factura-num">
                FACTURA #{pedido._id?.slice(-6).toUpperCase()}
              </div>
              <p>
                Fecha:{" "}
                {fecha.toLocaleDateString("es-CO", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
              <p>
                Hora:{" "}
                {fecha.toLocaleTimeString("es-CO", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              <p style={{ marginTop: 8 }}>
                <span className="factura-badge">{pedido.estado || "pendiente"}</span>
              </p>
            </div>
          </div>

          {/* Datos del cliente — usa p.usuario.nombres / apellidos / email */}
          <div className="factura-seccion">
            <h3>Datos del cliente</h3>
            <div className="factura-cliente-info">
              <p><strong>{nombreCompleto(pedido.usuario)}</strong></p>
              {pedido.usuario?.email && <p>{pedido.usuario.email}</p>}
              {pedido.direccion && (
                <p>
                  Dirección: {pedido.direccion}
                  {pedido.ciudad ? `, ${pedido.ciudad}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="factura-seccion">
            <h3>Detalle de productos</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th className="text-right">Precio unit.</th>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(pedido.items || []).map((item, i) => {
                  const precio = item.precioUnitario || item.precio || 0;
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.producto?.nombre || item.nombre || "Producto"}</td>
                      <td className="text-right">
                        ${Number(precio).toLocaleString("es-CO")}
                      </td>
                      <td className="text-right">{item.cantidad}</td>
                      <td className="text-right">
                        ${Number(precio * item.cantidad).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="factura-totales">
            <div className="factura-totales-fila">
              <span>Subtotal</span>
              <span>${Number(subtotal).toLocaleString("es-CO")}</span>
            </div>
            {envio > 0 && (
              <div className="factura-totales-fila">
                <span>Costo de envío</span>
                <span>${Number(envio).toLocaleString("es-CO")}</span>
              </div>
            )}
            <div className="factura-totales-fila factura-totales-fila--total">
              <span>TOTAL</span>
              <span>${Number(total).toLocaleString("es-CO")}</span>
            </div>
          </div>

          {/* Método de pago */}
          {pedido.metodoPago && (
            <div className="factura-seccion" style={{ marginTop: 24 }}>
              <h3>Método de pago</h3>
              <p style={{ fontSize: 13, color: "#333" }}>{pedido.metodoPago}</p>
            </div>
          )}

          {/* Pie */}
          <div className="factura-footer">
            <p>Gracias por tu compra · SEVE Aluminios © {new Date().getFullYear()}</p>
            <p style={{ marginTop: 4 }}>Este documento es una factura de venta válida.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
