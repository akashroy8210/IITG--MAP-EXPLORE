import NeoInput from './NeoInput';

export default function SearchBar({ value, onChange, placeholder = 'SEARCH STUDENTS, MAPS, ROUTEKEYS...' }) {
  return (
    <div style={{ flex: 1, maxWidth: 400 }}>
      <NeoInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="m-0"
      />
    </div>
  );
}
