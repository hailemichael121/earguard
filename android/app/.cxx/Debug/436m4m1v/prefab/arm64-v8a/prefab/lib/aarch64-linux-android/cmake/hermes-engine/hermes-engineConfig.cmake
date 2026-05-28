if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/home/hailemichael121/.gradle/caches/8.14.3/transforms/32e7190c616b24a25bc350b5324410be/transformed/hermes-android-250829098.0.10-debug/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/hailemichael121/.gradle/caches/8.14.3/transforms/32e7190c616b24a25bc350b5324410be/transformed/hermes-android-250829098.0.10-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

