#!/bin/sh
set -e

if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at $DB_HOST:$DB_PORT..."
  while ! nc -z "$DB_HOST" "$DB_PORT"; do
    sleep 1
  done
fi

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "--- Static debug info ---"
echo "Python version: $(python -V 2>&1)"
echo "Whitenoise version:"
python - <<'PY'
try:
  import whitenoise
  print(getattr(whitenoise, '__version__', '(no version)'))
except Exception as e:
  print('whitenoise not installed or import failed:', e)
PY

echo "Listing /app/staticfiles (top entries):"
ls -la /app/staticfiles 2>/dev/null || echo "/app/staticfiles not found"
echo "Listing /app/staticfiles/admin/css (top entries):"
ls -la /app/staticfiles/admin/css 2>/dev/null || echo "/app/staticfiles/admin/css not found"
echo "--- end static debug ---"

echo "Starting backend server..."
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
