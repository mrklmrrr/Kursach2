import './Input.css';

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  name,
  required = false,
  className = '',
  ...props
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`input-field ${className}`.trim()}
      {...props}
    />
  );
}
