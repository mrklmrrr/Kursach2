import React from 'react';
import './Card.css';

/**
 * Compound Component: Card
 *
 * Usage:
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Заголовок секции</Card.Title>
 *   </Card.Header>
 *   <Card.Body>Содержимое</Card.Body>
 *   <Card.Footer>
 *     <button>Действие</button>
 *   </Card.Footer>
 * </Card>
 */
function Card({ children, className }) {
  return <div className={`card ${className || ''}`}>{children}</div>;
}

function Header({ children, className }) {
  return <div className={`card-header ${className || ''}`}>{children}</div>;
}

function Title({ children, className, as }) {
  const Tag = as || 'h3';
  return <Tag className={`card-title ${className || ''}`}>{children}</Tag>;
}

function Body({ children, className }) {
  return <div className={`card-body ${className || ''}`}>{children}</div>;
}

function Footer({ children, className }) {
  return <div className={`card-footer ${className || ''}`}>{children}</div>;
}

Card.Header = Header;
Card.Title = Title;
Card.Body = Body;
Card.Footer = Footer;

export default Card;
