import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <div className="bottom-nav">
      <NavLink to="/home" className="nav-item" activeClassName="active">
        <span className="material-icons nav-icon">home</span> Главная
      </NavLink>
      <NavLink to="/doctors" className="nav-item" activeClassName="active">
        <span className="material-icons nav-icon">local_hospital</span> Врачи
      </NavLink>
      <NavLink to="/chats" className="nav-item" activeClassName="active">
        <span className="material-icons nav-icon">chat</span> Чаты
      </NavLink>
      <NavLink to="/emergency" className="nav-item" activeClassName="active">
        <span className="material-icons nav-icon">directions_car</span> Скорая
      </NavLink>
      <NavLink to="/profile" className="nav-item" activeClassName="active">
        <span className="material-icons nav-icon">person</span> Профиль
      </NavLink>
    </div>
  );
}