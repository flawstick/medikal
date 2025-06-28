ALTER TABLE public.vehicle_inspections
ADD COLUMN car_id BIGINT REFERENCES public.cars(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_car_id ON public.vehicle_inspections(car_id);
