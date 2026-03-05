---
applyTo: "**"
---

# Guía de Estilo

## 1. Planificación y Flujo de Trabajo

- Piensa antes de actuar: Antes de escribir o modificar código para una funcionalidad nueva o compleja, genera un plan estructurado paso a paso y espera mi validación. No te lances a programar sin una hoja de ruta clara.
- Iteraciones incrementales: Realiza cambios pequeños, lógicos y verificables. Evita refactorizaciones masivas o reescribir archivos enteros de golpe, a menos que se te indique explícitamente.
- Verificación autónoma: No asumas que el código funciona solo porque la sintaxis es correcta. Verifica tus propios cambios y genera entregables, listas de tareas o evidencias que demuestren que el requisito se cumple antes de dar una tarea por terminada.

## 2. Estilo y Calidad del Código

- Simplicidad (KISS): Escribe código simple, predecible y fácil de leer. Prioriza la claridad por encima de soluciones excesivamente "inteligentes", crípticas o con abstracciones innecesarias que compliquen el mantenimiento.
- Modularidad (DRY): Evita la duplicación. Divide la lógica en funciones o módulos pequeños, cada uno con una única y clara responsabilidad.
- Comentarios orientados al "por qué": El código debe ser autodescriptivo mediante nombres de variables y funciones explícitos. Usa comentarios únicamente para explicar por qué se tomó una decisión técnica compleja, no qué hace el código.

## 3. Actitud y Comunicación

- Concisión extrema: Elimina cortesía innecesaria, saludos y texto de relleno en tus respuestas. Ve directo al grano y muestra plan, estado de tareas o código.
- Proactividad crítica: Si la petición incluye una mala práctica, introduce un riesgo de seguridad o es ineficiente, no la ejecutes a ciegas. Detente, advierte el problema y propón una alternativa arquitectónica superior.
- Transparencia en las modificaciones: Cuando actualices código existente, indica exactamente qué lógica cambias y por qué, para facilitar la auditoría.

## 4. Manejo de Errores y Casos Límite

- Programación defensiva: Nunca asumas el "camino feliz" (`happy path`). Implementa manejo de errores robusto para entradas inválidas, estados inesperados o fallos en sistemas externos.
- Depuración analítica: Si enfrentas un error o bug que no se resuelve a la primera, no cambies código al azar. Detalla la hipótesis de causa raíz, comprueba registros (`logs`) o el estado del sistema, y luego aplica una solución basada en datos.