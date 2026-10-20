# Huecos de lógica

No están implementados. El trabajo de hoy deja el radar usable; estos mecanismos subirían la ingeniería del mismo objetivo: trabajo desde zona oeste ahora, y una mudanza posterior a Valencia con la familia.

## 1. El fit sigue siendo un cociente sobre el vocabulario propio

El matcher cuenta términos que ya sabe nombrar. Si esos términos aparecen y la lista de gaps no, el fit sube aunque el aviso pida otra cosa (Nix, imágenes de contenedor firmadas, un dominio que no está en `career/*.json`). La descripción cortada pasa a gap `unknown`, pero un texto largo y pobre en esas palabras también puede parecer cubierto.

Ingeniería: partir el aviso en requisitos obligatorios y deseables antes de puntuar. En Get on Board eso ya viene separado (`functions` frente a `desirable`); en el resto, hace falta un extractor que devuelva una lista o `unread`. El fit es cubiertos / obligatorios. Si la lista es `unread`, el fit tiene techo y el gap cost no puede ser bajo.

Sirve para no tratar como trabajo de ahora, desde zona oeste, un rol cuyo stack real no se leyó, y para no llevar a Valencia un aviso de España que solo coincidió en dos palabras.

## 2. La sede sigue siendo un id, y el viaje no tiene dos puntas

Get on Board manda `location_cities` como ids. El radar guarda el país y, si no hay país, «Remote». Zona oeste no tiene municipio a propósito. Con una sola punta no hay costo de viaje: hay una etiqueta.

Ingeniería: un diccionario de sedes (id → nombre publicado por la fuente, nunca un municipio inventado) y una función `commute(origen, sede)` que solo devuelve número cuando las dos puntas existen. Origen fijo: zona oeste, Buenos Aires, municipio nulo. Si la sede es solo «Argentina» o un id sin nombre, el resultado es `unknown` y el rol se muestra igual, sin distancia falsa. Valencia no entra en esa función: no es un viaje diario.

Sirve para ordenar híbridos y presenciales del AMBA que sí se pueden empezar ahora, y para no mezclarlos con un traslado a España.

## 3. Un solo enum de lugar no representa un rol puente

Hoy un aviso es `remote-now`, `local-onsite`, `relocation-watch` o se descarta. Un remoto que sirve desde zona oeste y sigue siendo legal después de vivir en Valencia es las dos cosas. Un remoto mundial que excluye España sirve ahora y se rompe con la mudanza. Un rol solo España no se puede empezar esta semana.

Ingeniería: dos booleanos independientes, `work_from_zona_oeste` y `work_after_valencia`, calculados con las restricciones del aviso (países permitidos, no la palabra «europe»). El ranking de MAIN usa el primero. El watch usa el segundo cuando el primero es falso. Un tercer estado, puente, exige los dos verdaderos y desempata por encima de un remoto que haya que dejar al mudarse.

Sirve para elegir trabajo ahora que no cierre la puerta de Valencia, y para no guardar como plan familiar un empleo que solo existe antes del viaje.

## 4. El salario no tiene tipo

El piso de ~1.000.000 sigue con moneda `to_confirm`, y el radar hace bien en no filtrar. El texto del aviso («115600-170000 USD / yearly», «3000-4400» sin moneda en Get on Board) se imprime al lado y se olvida como prosa. Cuando alguien confirme ARS bruto o neto, no hay nada que recompilar: hay que volver a leer frases.

Ingeniería: un valor `{ amount, currency, period, gross_or_net, source }` o `unparsed`. La comparación contra el piso es una función pura que devuelve `incomparable` mientras falte la moneda del piso o la del aviso. España se compara en EUR y en período mensual solo después de normalizar; no se resta de un piso en pesos.

Sirve para decidir si un remoto de ahora mejora el sueldo actual, y si un sueldo en Valencia alcanza para la mudanza con la familia, sin mezclar las dos unidades.

## 5. «SAP» es una sola familia

`sap` en el título marca la familia, y unas frases (`abap`, `sap fico`, `sap basis`) se tratan como gap fundamental. Un BTP o un Integration Suite que no use esas frases hereda el mismo potencial que un funcional. En el mercado español eso mezcla un camino técnico transferible con consultoría funcional que la evidencia de GitHub no sostiene.

Ingeniería: una gramática chica del título y de los primeros requisitos, con dos salidas: `sap_technical` (BTP, CAP, Integration Suite, APIs) y `sap_functional` (FICO, Basis, HCM, SuccessFactors, módulo sin build). Solo la primera entra al watch de Valencia/España, y siempre con el gap de producto SAP visible. La segunda no se retiene.

Sirve para que la búsqueda de más adelante en España no se llene de consultoría funcional, y para que un rol técnico de integración sí pueda aparecer como transición.

## 6. La mudanza no tiene ventana, y el modelo finge que sí

Sumar puntos porque el texto dice Valencia trata la mudanza como si tuviera fecha. No la tiene. Es una posibilidad posterior, juntos, no un inicio. Dos roles en España, uno que exige presencia el mes que viene y otro que puede esperar, quedan iguales.

Ingeniería: guardar `move_window: unknown` hasta que exista una fecha o un rango dicho por Ian. Cada aviso de España lleva `earliest_start` y `must_start_before` leídos del texto, o `unknown`. La función de valor de relocalización devuelve `not_yet_ordered` cuando la ventana es `unknown`, y solo ordena dentro del watch cuando las dos fechas existen y se solapan. Mientras tanto el watch lista, no rankea como si el viaje fuera inminente.

Sirve para no apresurar un empleo en Valencia y para no descartar uno que puede esperar a la familia.

## 7. El duplicado se decide con un umbral fijo de tokens

«Automation & DevOps Engineer» y «DevOps Engineer» de la misma empresa en España no cruzan el umbral y ocupan dos líneas del watch. El mismo rol en Himalayas y en otro board, con otra URL, tampoco. El colapso actual solo protege el top de una corrida y solo dentro de una empresa con títulos muy parecidos.

Ingeniería: una clave de bloqueo `empresa normalizada + familia + país` que fusione antes de cortar las cinco líneas del watch y las tres de MAIN/SIDE, más un identificador estable del aviso (URL canónica y, si hace falta, hash del título ya sin seniority). La ficha guarda los URLs fusionados en vez de borrar uno en silencio.

Sirve para que los pocos cupos de atención —trabajo de ahora en zona oeste, y el watch de Valencia— no se gasten en el mismo empleo repetido.
