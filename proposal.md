# MobilityPulse — propuesta de proyecto de datos

> Documento de planificación en Port. MobilityPulse tendrá su propio repositorio cuando empiece la implementación. Esta propuesta no implica que el pipeline, el modelo o el dashboard ya existan.

## Intención

Construir un pequeño producto de datos para practicar y demostrar **ingeniería de datos, analytics, data science y machine learning aplicado** con registros reales y voluminosos. La pregunta central es:

> ¿Cuántos viajes de Yellow Taxi se iniciarán en cada zona de NYC durante la próxima hora?

El proyecto expande el perfil de desarrollo full-stack y automatización hacia Data/Analytics Engineering y ML aplicado. El objetivo profesional es mostrar decisiones reproducibles y resultados medidos, no atribuirse experiencia senior en ciencia de datos por un solo ejercicio.

## Fuente y alcance

- Fuente: [NYC Taxi & Limousine Commission — Trip Record Data](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page), archivos mensuales **Yellow Taxi Trip Records** en Parquet.
- Diccionario: [Yellow Taxi Trip Records Data Dictionary](https://www.nyc.gov/assets/tlc/downloads/pdf/data_dictionary_trip_records_yellow.pdf).
- Grano del dato original: un viaje; grano analítico y predictivo: **zona de origen × hora**.
- Zona: `PULocationID`; tiempo: `tpep_pickup_datetime`. Documentar la zona horaria local y tratar las horas ambiguas/cambiantes por horario de verano antes de construir la grilla horaria.
- Demanda observada significa **cantidad de viajes registrados con origen en una zona**, no demanda insatisfecha, personas buscando taxi ni movilidad total de la ciudad.
- Descargar por mes, registrar los archivos y versiones utilizados y excluir los datos crudos del repositorio Git. Revisar cambios de esquema entre meses antes de unir archivos.

## Stack propuesto

| Capa | Herramienta | Uso |
| --- | --- | --- |
| Datos | Parquet | Archivos mensuales y salidas procesadas |
| Transformación | Python + Polars lazy | Selección de columnas, limpieza y agregaciones sin cargar todos los viajes a RAM |
| Consultas | DuckDB + SQL | Análisis exploratorio y tablas agregadas directamente sobre Parquet |
| Modelos | scikit-learn | Baselines, regresión y boosting tabular |
| Visualización | Plotly + Streamlit | Dashboard analítico y comparación de pronósticos |

Elegir responsabilidades concretas para Polars y DuckDB evita duplicar el mismo pipeline. Polars limpia y materializa los agregados; DuckDB los consulta para analytics. `scan_parquet` permite planificar trabajo de forma lazy; DuckDB puede leer Parquet con selección de columnas y filtros. El tamaño del dato de entrenamiento es mucho menor después de agregar por zona y hora.

## Flujo de datos

```text
NYC TLC (Parquet mensual)
    ↓ ingesta y manifiesto
data/raw/                  viajes originales
    ↓ Polars: validación, limpieza, transformación
data/processed/            viajes o agregados limpios
    ↓ DuckDB: SQL analítico; grilla zona × hora
data/gold/trips_hourly.parquet
    ↓ features históricas + split temporal
models/ + reports/         modelo, métricas y comparación
    ↓
dashboard/                 análisis y forecast
```

### Reglas de calidad

1. Validar columnas obligatorias y tipos por archivo; registrar filas de entrada, retenidas y descartadas con motivo.
2. Excluir viajes con tiempo de origen inválido, zona de origen nula/inválida, distancia o duración negativa, y valores extremos según reglas documentadas. Evitar que filtros arbitrarios borren demanda real.
3. Distinguir valores ausentes de cero. Construir una grilla explícita de zona × hora para representar horas con **cero viajes observados** en el período cubierto.
4. Conservar la procedencia por mes y la ventana temporal. No mezclar meses parciales con meses completos sin marcarlo.
5. No subir datos crudos ni modelos grandes a Git; publicar scripts de descarga y resultados reproducibles.

## Analytics: preguntas a responder

Consultas y gráficos iniciales:

- Viajes por hora, día, día de semana y mes.
- Viajes por zona y borough; zonas más activas y horarios pico.
- Tarifa promedio, distancia, duración, propinas reportadas e ingresos estimados según los campos efectivamente disponibles.
- Pares origen → destino más frecuentes.
- Cruces `borough × hour`, `zone × weekday`, `zone × hour`, `weekday × demand`, `distance × fare` y `trip_duration × traffic_period`.
- Comparación de patrones laborales y de fin de semana, y variación entre meses.

El reporte debe incluir **5–10 consultas SQL explicadas** y al menos tres hallazgos con números, período, denominador y límites de interpretación. Una diferencia visual no es una conclusión causal.

## Predicción de la próxima hora

### Tabla analítica

Una fila por zona y hora `t`:

| Campo | Significado |
| --- | --- |
| `zone_id`, `hour_ts` | Zona de origen y hora de observación |
| `hour`, `weekday`, `month` | Variables de calendario disponibles para la predicción |
| `trips_t`, `trips_t_minus_1`, `trips_t_minus_24`, `trips_t_minus_168` | Demanda actual e historial reciente, del mismo horario anterior y de la semana anterior |
| `rolling_3h`, `rolling_24h` | Promedios calculados sólo con horas ya observadas |
| `avg_fare_past`, `avg_duration_past` | Opcionales: agregados conocidos hasta `t`, nunca de la hora futura |
| `trips_next_hour` | Target: viajes en la misma zona durante `t + 1 hora` |

Para predecir al cierre de la hora `t`, todas las features deben poder conocerse en ese momento. Si el forecast se ejecuta antes del cierre, `trips_t` tampoco está disponible y hay que desplazar los lags. Descartar filas sin historial suficiente o marcar explícitamente la estrategia de imputación. Verificar las ventanas en los límites de mes y zona.

### Evaluación

- Separar **entrenamiento → validación → test** por fecha, sin mezclar horas futuras en entrenamiento. Mantener el último período como test intacto.
- Baselines: valor de la hora anterior, misma hora del día anterior y misma hora de la semana anterior; comparar contra `DummyRegressor` cuando tenga sentido.
- Modelos candidatos: `LinearRegression` o un modelo lineal regularizado, y `HistGradientBoostingRegressor`; `RandomForestRegressor` queda opcional si tiempo y memoria lo permiten. Tratar `zone_id` como categoría/codificación adecuada, no como distancia numérica entre IDs.
- Medir **MAE** y **RMSE** global y por zonas de alta/baja demanda. `R²` puede informarse con cuidado como métrica secundaria. Mostrar el error junto al baseline, no sólo una cifra aislada.
- Graficar real vs. predicho y analizar dónde falla: noche, fines de semana, zonas escasas, cambios de mes. Si el modelo no supera al baseline en test, reportarlo honestamente.
- Guardar parámetros, período, filas, métricas y versiones para reproducibilidad. Evitar claims de precisión antes de medirlos.

## Dashboard

Una pantalla Streamlit con filtros de fecha, borough y zona:

- KPIs: viajes, tarifa promedio, distancia y duración promedio, para la selección vigente.
- Gráfico de demanda por hora/día y ranking de zonas de origen.
- Mapa por zona si el mapa oficial y el tiempo disponible lo permiten; una tabla/ranking clara sirve para el MVP.
- Forecast de la próxima hora por zona con valor predicho, valor real cuando exista y error histórico del modelo.
- Comparación visible entre modelo y baseline, con período de entrenamiento/test y alcance de la predicción.

El dashboard debe leer **agregados pequeños y predicciones guardadas**, no volver a procesar todos los archivos originales en cada interacción.

## Estructura del futuro repositorio

```text
mobility-pulse/
├── data/
│   ├── raw/                  # gitignored
│   ├── processed/            # gitignored
│   └── gold/                 # gitignored o muestra pequeña
├── src/
│   ├── ingest.py
│   ├── transform.py
│   ├── analytics.py
│   ├── features.py
│   └── train.py
├── dashboard/
│   └── app.py
├── models/                   # artefactos generados, gitignored
├── notebooks/
│   └── exploration.ipynb
├── sql/
├── reports/
├── tests/                    # controles significativos de grano, lags y fuga temporal
├── README.md
├── requirements.txt         # versiones fijadas al implementar
├── Makefile
└── .gitignore
```

Las rutas son una propuesta, no archivos existentes. El README final debe incluir comandos para reproducir, fuente y período, tamaño realmente procesado, reglas de limpieza, decisiones, métricas comparadas, hallazgos, capturas del dashboard y limitaciones.

## Plan de ejecución

### MVP para mañana

1. Crear repo independiente, entorno Python, `.gitignore` y README inicial.
2. Descargar **1–2 meses completos** de Yellow Taxi; inspeccionar esquema, tamaños y calidad. Escalar sólo después de tener una corrida completa.
3. Implementar ingesta, limpieza y agregado zona × hora con Polars; generar manifiesto y conteos de calidad.
4. Ejecutar al menos cinco consultas SQL con DuckDB y producir tres hallazgos verificables.
5. Crear features sin fuga temporal, partición cronológica y 2–3 baselines; entrenar un modelo tabular si queda tiempo.
6. Montar un dashboard simple con KPIs, serie temporal, ranking y, si el modelo está evaluado, su forecast.
7. Documentar comandos, período, volumen real, métricas y límites. Publicar el repo del proyecto.

**Mínimo demostrable:** pipeline reproducible + análisis SQL + baseline medido + dashboard que lea agregados. Un modelo complejo o un mapa no bloquean la entrega.

### Ampliación posterior

- Procesar **6–12 meses** y comprobar memoria, tiempo, costo de almacenamiento y cambios de esquema; entonces sí describir el volumen efectivamente alcanzado.
- Añadir mapa oficial de taxi zones, más análisis de origen → destino y comparación entre temporadas.
- Mejorar el modelo y evaluar por zonas/ventanas; explorar LightGBM si hay una ganancia demostrable.
- Automatizar ingestión incremental; considerar dbt, MLflow o almacenamiento adicional cuando haya necesidad real. Spark, Kafka, Airflow, Kubernetes y nube distribuida quedan fuera del MVP.

## Criterios de aceptación

- Una persona puede descargar los datos autorizados y ejecutar el pipeline siguiendo el README.
- El reporte muestra conteos de filas, reglas de limpieza, grano y período exacto.
- Las consultas SQL y el dashboard leen artefactos generados por el mismo pipeline.
- El test temporal no participa del entrenamiento ni del ajuste de hiperparámetros.
- Todas las features usadas para `t + 1` existen al cierre de `t`.
- El resultado del modelo se compara con baselines y se comunica incluso si pierde.
- Los números del CV/portfolio se derivan de la corrida real, nunca de la estimación inicial.

## Cómo contarlo en portfolio

Después de medirlo, una descripción posible en inglés:

> Built a reproducible NYC taxi analytics pipeline with Polars, DuckDB, SQL and Parquet, processing [N] trip records across [M] months; evaluated next-hour pickup forecasts against temporal baselines and presented findings in an interactive dashboard.

Reemplazar `[N]` y `[M]` por los resultados observados. El proyecto evidencia práctica en ingeniería de datos, analytics y ML aplicado; complementa la experiencia previa de producto y desarrollo.

## Referencias

- [NYC TLC Trip Record Data](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page)
- [NYC TLC Yellow Taxi Data Dictionary](https://www.nyc.gov/assets/tlc/downloads/pdf/data_dictionary_trip_records_yellow.pdf)
- [Polars: lazy sources and sinks](https://docs.pola.rs/user-guide/lazy/sources_sinks/)
- [DuckDB: querying Parquet files](https://duckdb.org/docs/current/guides/file_formats/query_parquet)
