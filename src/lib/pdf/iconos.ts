/* Iconos vectoriales del pie de los PDF (ubicación, email, teléfono). */

export function dibujarIconoUbicacion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  x: number,
  y: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color: any
) {
  // Cabeza del pin
  page.drawCircle({
    x: x + 5,
    y: y + 7,
    size: 4.5,
    borderColor: color,
    borderWidth: 1.2,
  });

  // Punta del pin
  page.drawLine({
    start: {
      x: x + 1.5,
      y: y + 4,
    },
    end: {
      x: x + 5,
      y: y - 1,
    },
    thickness: 1.2,
    color,
  });

  page.drawLine({
    start: {
      x: x + 8.5,
      y: y + 4,
    },
    end: {
      x: x + 5,
      y: y - 1,
    },
    thickness: 1.2,
    color,
  });

  // Centro del pin
  page.drawCircle({
    x: x + 5,
    y: y + 7,
    size: 1.4,
    color,
  });
}

export function dibujarIconoEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  x: number,
  y: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color: any
) {
  // Contorno del sobre
  page.drawRectangle({
    x,
    y,
    width: 12,
    height: 9,
    borderColor: color,
    borderWidth: 1.1,
  });

  // Diagonales internas
  page.drawLine({
    start: {
      x,
      y: y + 9,
    },
    end: {
      x: x + 6,
      y: y + 4.2,
    },
    thickness: 1,
    color,
  });

  page.drawLine({
    start: {
      x: x + 12,
      y: y + 9,
    },
    end: {
      x: x + 6,
      y: y + 4.2,
    },
    thickness: 1,
    color,
  });
}

export function dibujarIconoTelefono(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  x: number,
  y: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color: any
) {
  page.drawSvgPath(
    "M6.62 10.79c1.44 1.44 2.89 2.7 4.37 3.79.2.15.45.21.69.16l2.78-.69c.29-.07.53-.3.6-.6l.7-2.78a.99.99 0 0 0-.25-.91l-1.27-1.27a.99.99 0 0 0-1.41 0l-1.11 1.11a15.3 15.3 0 0 1-3.58-3.58l1.11-1.11a.99.99 0 0 0 0-1.41L8.98 2.24a.99.99 0 0 0-.91-.25l-2.78.7c-.29.07-.53.3-.6.6L4 6.07c-.06.24.01.49.16.69 1.09 1.48 2.35 2.93 3.79 4.37z",
    {
      x,
      y,
      scale: 0.85,
      color,
    }
  );
}
