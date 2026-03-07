from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """Only staff/superuser users can perform this action."""

    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class IsAdminOrReadOnly(BasePermission):
    """Anyone authenticated can read; only admin can write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class IsAdminOrJoinLeaveTeam(BasePermission):
    """
    Teams: admin can do anything.
    Regular users can read and PATCH (join/leave themselves).
    POST and DELETE are admin-only.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        # Allow PATCH for join/leave (enforced in the view)
        return request.method == 'PATCH'


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission for Activity:
    - Admin can do anything.
    - Regular users can only edit/delete their own activities.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in SAFE_METHODS:
            return True
        # obj.user is the username string on Activity
        return getattr(obj, 'user', None) == request.user.username


class IsAdminOrCreateOnly(BasePermission):
    """
    Activity creation: any authenticated user can create.
    Edit/delete handled by IsOwnerOrAdmin at object level.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS or request.method == 'POST':
            return True
        # PUT/PATCH/DELETE — allow through, object-level perm will check ownership
        return True
