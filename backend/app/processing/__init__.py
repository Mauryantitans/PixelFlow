"""
Declarative image-processing operation registry.

The registry is the single source of truth for operation metadata and
parameter schemas; `executor.execute_step` validates/coerces and runs a step.
See `registry.registry` and `param_specs`.
"""

from .registry import registry

__all__ = ["registry"]
