import React, { createContext, useContext, useState, useCallback } from 'react';
import './Tabs.css';

const TabsContext = createContext(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs subcomponents must be used within <Tabs>');
  return ctx;
}

/**
 * Compound Component: Tabs
 *
 * Usage:
 * <Tabs defaultValue="requests" onValueChange={setTab}>
 *   <Tabs.List>
 *     <Tabs.Trigger value="requests">Заявки <Badge>3</Badge></Tabs.Trigger>
 *     <Tabs.Trigger value="upcoming">Расписание</Tabs.Trigger>
 *   </Tabs.List>
 *   <Tabs.Content value="requests">...</Tabs.Content>
 *   <Tabs.Content value="upcoming">...</Tabs.Content>
 * </Tabs>
 */
function Tabs({ defaultValue, value, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const setValue = useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeValue, setValue }}>
      <div className={`tabs-root ${className || ''}`}>{children}</div>
    </TabsContext.Provider>
  );
}

function List({ children, className }) {
  return (
    <div className={`tabs-list ${className || ''}`} role="tablist">
      {children}
    </div>
  );
}

function Trigger({ value, children, className, disabled }) {
  const { activeValue, setValue } = useTabs();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      className={`tab-trigger ${isActive ? 'active' : ''} ${className || ''}`}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

function Content({ value, children, className }) {
  const { activeValue } = useTabs();
  if (activeValue !== value) return null;
  return (
    <div role="tabpanel" className={`tab-content ${className || ''}`}>
      {children}
    </div>
  );
}

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Content = Content;

export default Tabs;
