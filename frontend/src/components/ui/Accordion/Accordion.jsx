import React, { createContext, useContext, useState, useCallback } from 'react';
import './Accordion.css';

const AccordionContext = createContext(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion subcomponents must be used within <Accordion>');
  return ctx;
}

/**
 * Compound Component: Accordion
 *
 * Usage:
 * <Accordion type="single" collapsible>
 *   <Accordion.Item value="cardio">
 *     <Accordion.Trigger>Кардиология</Accordion.Trigger>
 *     <Accordion.Content>Описание системы...</Accordion.Content>
 *   </Accordion.Item>
 * </Accordion>
 */
function Accordion({ type = 'single', collapsible = false, value, defaultValue, onValueChange, children, className }) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => {
    if (defaultValue !== undefined) return defaultValue;
    return type === 'single' ? '' : [];
  });

  const resolvedValue = isControlled ? value : internalValue;

  const setValue = useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const toggle = useCallback(
    (itemValue) => {
      if (type === 'single') {
        if (resolvedValue === itemValue) {
          if (collapsible) setValue('');
        } else {
          setValue(itemValue);
        }
      } else {
        const current = Array.isArray(resolvedValue) ? resolvedValue : [];
        if (current.includes(itemValue)) {
          setValue(current.filter((v) => v !== itemValue));
        } else {
          setValue([...current, itemValue]);
        }
      }
    },
    [type, collapsible, resolvedValue, setValue]
  );

  const isOpen = useCallback(
    (itemValue) => {
      if (type === 'single') return resolvedValue === itemValue;
      return Array.isArray(resolvedValue) && resolvedValue.includes(itemValue);
    },
    [type, resolvedValue]
  );

  return (
    <AccordionContext.Provider value={{ type, toggle, isOpen }}>
      <div className={`accordion ${className || ''}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

function Item({ value, children, className }) {
  return (
    <div className={`accordion-item ${className || ''}`} data-value={value}>
      {children}
    </div>
  );
}

function Trigger({ children, className }) {
  const { toggle, isOpen } = useAccordion();
  const itemValue = useItemValue();
  const open = isOpen(itemValue);

  return (
    <button
      type="button"
      className={`accordion-trigger ${open ? 'open' : ''} ${className || ''}`}
      onClick={() => toggle(itemValue)}
      aria-expanded={open}
    >
      <span className="accordion-trigger-label">{children}</span>
      <span className="accordion-trigger-icon">{open ? '−' : '+'}</span>
    </button>
  );
}

function Content({ children, className }) {
  const { isOpen } = useAccordion();
  const itemValue = useItemValue();
  const open = isOpen(itemValue);

  if (!open) return null;

  return (
    <div className={`accordion-content ${className || ''}`}>{children}</div>
  );
}

// Helper to read item value from DOM data attribute
function useItemValue() {
  const [value, setValue] = useState('');
  const ref = useCallback((node) => {
    if (node) {
      const item = node.closest('.accordion-item');
      if (item) setValue(item.dataset.value || '');
    }
  }, []);
  return value || ref;
}

// Simpler approach: pass value through React.cloneElement
// Re-implementing with explicit value prop for reliability

function AccordionItem({ value, children, className }) {
  return (
    <div className={`accordion-item ${className || ''}`} data-value={value}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { __itemValue: value }) : child
      )}
    </div>
  );
}

function AccordionTrigger({ children, className, __itemValue }) {
  const { toggle, isOpen } = useAccordion();
  const open = isOpen(__itemValue);

  return (
    <button
      type="button"
      className={`accordion-trigger ${open ? 'open' : ''} ${className || ''}`}
      onClick={() => toggle(__itemValue)}
      aria-expanded={open}
    >
      <span className="accordion-trigger-label">{children}</span>
      <span className="accordion-trigger-icon">{open ? '−' : '+'}</span>
    </button>
  );
}

function AccordionContent({ children, className, __itemValue }) {
  const { isOpen } = useAccordion();
  const open = isOpen(__itemValue);

  if (!open) return null;

  return (
    <div className={`accordion-content ${className || ''}`}>{children}</div>
  );
}

Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

export default Accordion;
