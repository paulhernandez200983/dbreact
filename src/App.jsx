import { useState, useEffect } from "react";
import sqlWasm from "sql.js/dist/sql-wasm.js";
import wasmBinary from "sql.js/dist/sql-wasm.wasm?url";

export default function AuthApp() {
  // Estados
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Inicializar SQLite
  useEffect(() => {
    const initializeDB = async () => {
      try {
        const SQL = await sqlWasm({
          locateFile: () => wasmBinary,
        });

        const database = new SQL.Database();

        // Crear tabla de usuarios
        database.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
          );
          
          INSERT OR IGNORE INTO users (email, password)
          VALUES ('admin@example.com', 'admin123');
        `);

        setDb(database);

        // Verificar sesión existente
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error al iniciar SQLite:", err);
        setError("Error al cargar la base de datos");
      } finally {
        setLoading(false);
      }
    };

    initializeDB();
  }, []);

  // Manejadores
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = db.exec(
        "SELECT id, email FROM users WHERE email = ? AND password = ?",
        [formData.email, formData.password]
      );

      if (result.length === 0) throw new Error("Email o contraseña incorrectos");

      const userData = {
        id: result[0].values[0][0],
        email: result[0].values[0][1],
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setSuccess(`Bienvenido de vuelta!`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");

    try {
      if (formData.password !== formData.confirmPassword)
        throw new Error("Las contraseñas no coinciden");

      db.exec(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [formData.email, formData.password]
      );

      setSuccess("Cuenta creada. ¡Ahora inicia sesión!");
      setIsLoginView(true);
      setFormData({ email: "", password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.message.includes("UNIQUE") ? "El email ya está registrado" : err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setSuccess("Sesión cerrada");
  };

  // Renderizado condicional
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {user ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <span className="text-blue-600 font-bold text-xl">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
            <p className="text-gray-600 mb-6">{user.email}</p>
              
            <button
              onClick={handleLogout}
              className="w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              Cerrar sesión
            </button>
            
            {success && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {isLoginView ? "Iniciar sesión" : "Crear cuenta"}
              </h1>
              <p className="text-gray-500 mb-6">
                {isLoginView ? "Ingresa a tu cuenta" : "Regístrate para comenzar"}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <form 
                onSubmit={isLoginView ? handleLogin : handleRegister} 
                className="space-y-4 max-w-xs mx-auto"
              >
                <div className="text-left">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                  />
                </div>

                <div className="text-left">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                  />
                </div>

                {!isLoginView && (
                  <div className="text-left">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                    />
                  </div>
                )}

                {isLoginView && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  {isLoginView ? "Iniciar sesión" : "Registrarse"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLoginView(!isLoginView);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-sm"
                >
                  {isLoginView
                    ? "¿No tienes cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}