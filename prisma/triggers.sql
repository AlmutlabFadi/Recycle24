-- Control Tower: Postgres NOTIFY triggers
-- Run these AFTER prisma db push to enable realtime event streaming.

-- 1) ControlEvent insert trigger
CREATE OR REPLACE FUNCTION notify_control_event_insert()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'id', NEW.id,
    'ts', NEW.ts,
    'event_type', NEW."eventType",
    'severity', NEW.severity,
    'source', NEW."sourceComponentKey"
  );
  PERFORM pg_notify('control_events_channel', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_control_event ON "ControlEvent";
CREATE TRIGGER trg_notify_control_event
AFTER INSERT ON "ControlEvent"
FOR EACH ROW EXECUTE FUNCTION notify_control_event_insert();

-- 2) Alert insert/update trigger
CREATE OR REPLACE FUNCTION notify_alert_change()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'id', NEW.id,
    'status', NEW.status,
    'severity', NEW.severity,
    'rule_key', NEW."ruleKey",
    'title', NEW.title
  );
  PERFORM pg_notify('alerts_channel', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_alert ON "CtAlert";
CREATE TRIGGER trg_notify_alert
AFTER INSERT OR UPDATE ON "CtAlert"
FOR EACH ROW EXECUTE FUNCTION notify_alert_change();

-- 3) Action insert/update trigger
CREATE OR REPLACE FUNCTION notify_action_change()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'id', NEW.id,
    'type', NEW.type,
    'status', NEW.status
  );
  PERFORM pg_notify('actions_channel', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_action ON "ControlAction";
CREATE TRIGGER trg_notify_action
AFTER INSERT OR UPDATE ON "ControlAction"
FOR EACH ROW EXECUTE FUNCTION notify_action_change();

-- 4) KillSwitch update trigger
CREATE OR REPLACE FUNCTION notify_killswitch_change()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'id', NEW.id,
    'key', NEW.key,
    'state', NEW.state,
    'reason', NEW.reason
  );
  PERFORM pg_notify('killswitch_channel', payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_killswitch ON "KillSwitch";
CREATE TRIGGER trg_notify_killswitch
AFTER UPDATE ON "KillSwitch"
FOR EACH ROW EXECUTE FUNCTION notify_killswitch_change();
