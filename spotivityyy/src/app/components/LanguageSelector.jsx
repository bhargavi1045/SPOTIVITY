export default function LanguageSelector({ setLanguage }) {
    return (
      <select onChange={(e) => setLanguage(e.target.value)} className="dropdown">
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </select>
    );
  }
  