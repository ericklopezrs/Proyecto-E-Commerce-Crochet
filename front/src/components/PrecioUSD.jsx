import { useEffect, useState } from 'react';
import { fetchGraphQL } from '../graphql/cliente.js';

let tasaCache = null;

export default function PrecioUSD({ mxn }) {
  const [tasa, setTasa] = useState(tasaCache);

  useEffect(() => {
    if (tasaCache) return;
    fetchGraphQL(`query { tipoCambio(moneda: "USD") }`)
      .then((d) => { tasaCache = d.tipoCambio; setTasa(d.tipoCambio); })
      .catch(() => {});
  }, []);

  if (!tasa) return null;
  return <span>≈ ${(mxn * tasa).toFixed(2)} USD</span>;
}