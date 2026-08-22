# Autenticación de la aplicación

## Flujo implementado

```text
Login (/login)
  ↓
Next Server Action
  ↓
LoginUser (application)
  ↓
AuthRepository
  ↓
POST /auth/login (NestJS)
  ↓
Cookies HttpOnly de access y refresh token
  ↓
/dashboard
```

NestJS valida el email y la contraseña y es la fuente de verdad de la
autenticación. Next valida solamente la forma del input con Zod, llama al caso
de uso desde servidor y nunca entrega los tokens al componente cliente.

## Sesión en Next

Los tokens viven en cookies separadas y centralizadas. Ambas usan:

```text
httpOnly: true
secure: true en producción
sameSite: "lax"
path: "/"
maxAge: min(vencimiento real del token, 60 * 60 * 24)
```

Cada cookie respeta la expiración informada por NestJS y nunca sobrevive más
de 24 horas. No se usa `localStorage`, `sessionStorage` ni Zustand: impedir que
JavaScript lea los tokens reduce la superficie de exposición ante XSS. La
pantalla `/login` lee las cookies en servidor y valida el access token mediante
`GET /auth/me`; sólo entonces redirige al dashboard. La mera presencia de una
cookie no autentica al usuario.

La respuesta de login se recibe como `unknown` y Zod valida el usuario seguro,
ambos tokens y sus fechas de expiración antes de mapearla al dominio. Password,
password hash y tokens de Mercado Libre nunca forman parte de ese modelo.

## Renovación preparada

NestJS dispone de `POST /auth/refresh`, que rota el access token y el refresh
token. La persistencia se concentra en `createSession()`, por lo que el futuro
flujo de refresh podrá reemplazar atómicamente ambas cookies sin modificar la
UI. La renovación automática y la protección global de rutas no forman parte de
esta etapa.

OAuth de Mercado Libre es una autorización independiente de la autenticación
del panel y no se implementa aquí.

## Cierre de sesión

El dashboard envía un formulario a una Server Action. Next lee el access token
HttpOnly y el caso de uso `LogoutUser` solicita `POST /auth/logout` con Bearer;
el navegador nunca recibe el token. Al finalizar, Next invalida siempre las dos
cookies y redirige a `/login`, incluso si el access token ya venció o NestJS no
está disponible. El cierre local inmediato tiene prioridad y el access token de
corta duración limita la ventana residual si la revocación remota falla.
